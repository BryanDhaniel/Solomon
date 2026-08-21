import { randomUUID } from "crypto";
import { store } from "./store";
import { getTool } from "./tools/registry";
import { getLlm } from "./planner";
import { waitForApproval } from "./approval-waiter";
import type { ServerEvent } from "./events";
import type {
  ExecutionStep,
  Plan,
  Step,
  StepResult,
  ToolInput,
  ToolOutput,
} from "@/lib/shared/types";

export type EngineHooks = {
  emit: (evt: ServerEvent) => void;
  signal?: AbortSignal;
  assistantMessageId: string;
};

export type EngineResult = {
  status: "completed" | "failed" | "cancelled";
  finalText: string;
  error?: string;
};

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const t = setTimeout(resolve, ms);
    if (signal) {
      signal.addEventListener(
        "abort",
        () => {
          clearTimeout(t);
          resolve();
        },
        { once: true }
      );
    }
  });
}

async function executeTool(step: Step): Promise<ToolOutput> {
  const tool = getTool(step.tool ?? "");
  if (!tool) {
    return { success: false, error: `Unknown tool: ${step.tool}` };
  }
  const input: ToolInput = {
    action: step.action ?? "",
    parameters: step.parameters ?? {},
  };
  return tool.execute(input);
}

/**
 * Streams the final assistant response as `message.chunk` events, simulating
 * token streaming so the pipeline behaves like a real LLM.
 */
async function streamText(
  text: string,
  hooks: EngineHooks
): Promise<void> {
  const chunkSize = 6;
  for (let i = 0; i < text.length; i += chunkSize) {
    if (hooks.signal?.aborted) return;
    hooks.emit({
      event: "message.chunk",
      data: { text: text.slice(i, i + chunkSize) },
    });
    await sleep(12, hooks.signal);
  }
  hooks.emit({
    event: "message.complete",
    data: { messageId: hooks.assistantMessageId, fullText: text },
  });
}

export async function runExecution(
  executionId: string,
  input: string,
  plan: Plan,
  hooks: EngineHooks
): Promise<EngineResult> {
  const now = () => new Date().toISOString();
  const results: StepResult[] = [];
  let finalText = "";

  hooks.emit({
    event: "execution.started",
    data: { executionId, conversationId: store.getExecution(executionId)?.conversationId ?? "" },
  });

  for (let index = 0; index < plan.steps.length; index++) {
    const step = plan.steps[index];

    if (hooks.signal?.aborted) {
      store.updateExecutionStatus(executionId, "cancelled");
      return { status: "cancelled", finalText: "" };
    }

    const stepRow: ExecutionStep = {
      id: step.id,
      executionId,
      index,
      type: step.type,
      description: step.description,
      status: "running",
      tool: step.tool,
      action: step.action,
      parameters: step.parameters,
      startedAt: now(),
    };
    store.upsertStep(stepRow);
    hooks.emit({
      event: "execution.step",
      data: { stepId: step.id, index, description: step.description, status: "running" },
    });
    await sleep(150, hooks.signal);

    if (step.type === "think") {
      stepRow.status = "completed";
      stepRow.completedAt = now();
      store.upsertStep(stepRow);
      hooks.emit({
        event: "execution.step",
        data: { stepId: step.id, index, description: step.description, status: "completed" },
      });
      continue;
    }

    if (step.type === "respond") {
      const text = await getLlm().composeResponse(input, results);
      finalText = text;
      await streamText(text, hooks);
      stepRow.status = "completed";
      stepRow.completedAt = now();
      store.upsertStep(stepRow);
      continue;
    }

    if (step.type === "tool_call") {
      const tool = getTool(step.tool ?? "");
      hooks.emit({
        event: "execution.tool_call",
        data: {
          stepId: step.id,
          tool: step.tool ?? "",
          action: step.action ?? "",
          params: step.parameters ?? {},
        },
      });

      // Human approval gate for irreversible actions.
      if (tool && tool.actionType(step.action ?? "") === "irreversible") {
        const approvalId = randomUUID();
        store.createApproval({
          id: approvalId,
          executionId,
          stepId: step.id,
          tool: step.tool ?? "",
          action: step.action ?? "",
          parameters: step.parameters ?? {},
          description: step.description,
          status: "pending",
          createdAt: now(),
        });
        store.updateExecutionStatus(executionId, "awaiting_approval");
        stepRow.status = "awaiting_approval";
        store.upsertStep(stepRow);
        hooks.emit({
          event: "execution.approval_required",
          data: {
            approvalId,
            tool: step.tool ?? "",
            action: step.action ?? "",
            description: step.description,
            params: step.parameters ?? {},
          },
        });

        let decision: "approved" | "rejected";
        try {
          decision = await waitForApproval(approvalId, hooks.signal);
        } catch {
          store.updateExecutionStatus(executionId, "cancelled");
          return { status: "cancelled", finalText: "" };
        }

        if (decision === "rejected") {
          stepRow.status = "failed";
          stepRow.error = "User rejected the action";
          stepRow.completedAt = now();
          store.upsertStep(stepRow);
          store.updateExecutionStatus(executionId, "failed", {
            completedAt: now(),
            error: "User rejected the action",
          });
          hooks.emit({
            event: "execution.step",
            data: { stepId: step.id, index, description: step.description, status: "failed" },
          });
          hooks.emit({
            event: "execution.error",
            data: { executionId, error: "User rejected the action", code: "approval_rejected" },
          });
          return { status: "cancelled", finalText: "" };
        }
      }

      const output = await executeTool(step);
      hooks.emit({
        event: "execution.tool_result",
        data: { stepId: step.id, tool: step.tool ?? "", result: output.data, success: output.success },
      });

      stepRow.status = output.success ? "completed" : "failed";
      stepRow.result = output.data;
      stepRow.error = output.error;
      stepRow.completedAt = now();
      store.upsertStep(stepRow);
      results.push({
        stepId: step.id,
        description: step.description,
        tool: step.tool,
        action: step.action,
        result: output.data,
        error: output.error,
      });

      if (!output.success) {
        // Graceful failure: report and stop the run.
        store.updateExecutionStatus(executionId, "failed", {
          completedAt: now(),
          error: output.error,
        });
        hooks.emit({
          event: "execution.error",
          data: { executionId, error: output.error ?? "Tool execution failed" },
        });
        return { status: "failed", finalText: "", error: output.error };
      }
    }
  }

  // If the plan had no respond step (e.g. all tool calls), compose a summary.
  if (!plan.steps.some((s) => s.type === "respond")) {
    finalText = await getLlm().composeResponse(input, results);
    await streamText(finalText, hooks);
  }

  store.updateExecutionStatus(executionId, "completed", {
    completedAt: now(),
    result: finalText || "Completed",
  });
  hooks.emit({
    event: "execution.completed",
    data: { executionId, result: finalText || "Completed" },
  });

  return { status: "completed", finalText };
}
