import type { StepStatus } from "@/lib/shared/types";

/**
 * SSE events mirror the WebSocket event model from docs/api.md so that the
 * transport can be swapped for a real WebSocket later without changing the
 * client or the execution engine.
 */
export type ServerEvent =
  | {
      event: "execution.started";
      data: { executionId: string; conversationId: string };
    }
  | {
      event: "execution.step";
      data: {
        stepId: string;
        index: number;
        description: string;
        status: StepStatus;
      };
    }
  | {
      event: "execution.tool_call";
      data: {
        stepId: string;
        tool: string;
        action: string;
        params: Record<string, unknown>;
      };
    }
  | {
      event: "execution.tool_result";
      data: { stepId: string; tool: string; result: unknown; success: boolean };
    }
  | {
      event: "execution.approval_required";
      data: {
        approvalId: string;
        tool: string;
        action: string;
        description: string;
        params: Record<string, unknown>;
      };
    }
  | {
      event: "execution.completed";
      data: { executionId: string; result: string };
    }
  | {
      event: "execution.error";
      data: { executionId: string; error: string; code?: string };
    }
  | { event: "message.chunk"; data: { text: string } }
  | { event: "message.complete"; data: { messageId: string; fullText: string } }
  | { event: "conversation.created"; data: { conversationId: string; title: string } };

export function encodeEvent(evt: ServerEvent): string {
  return `data: ${JSON.stringify(evt)}\n\n`;
}
