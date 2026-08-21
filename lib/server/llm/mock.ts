import { randomUUID } from "crypto";
import type { LLM } from "./types";
import type { Plan, Step, StepResult } from "@/lib/shared/types";

function step(
  type: Step["type"],
  description: string,
  extra: Partial<Step> = {}
): Step {
  return { id: randomUUID(), type, description, ...extra };
}

export class MockLLM implements LLM {
  readonly name = "mock";

  async createPlan(input: string): Promise<Plan> {
    void input;
    return {
      steps: [
        step("think", "Understanding the request"),
        step("respond", "Answering"),
      ],
    };
  }

  async composeResponse(input: string, results: StepResult[]): Promise<string> {
    const toolSteps = results.filter((r) => r.tool);

    if (toolSteps.length > 0) {
      const lines: string[] = [];
      for (const r of toolSteps) {
        if (r.error) {
          lines.push(`I ran into a problem with \`${r.action}\`:\n\n> ${r.error}`);
          continue;
        }
        lines.push(`Done — completed \`${r.action}\`.`);
      }
      return lines.join("\n\n");
    }

    return `Understood. Here's how I'd think through **${input.trim() || "that"}**:

The key is separating what's urgent from what's important. First, define the constraint — time, budget, scope, or headcount — because optimizing for speed looks very different from optimizing for quality. Next, map the dependencies to find the critical path. Finally, agree on explicit exit criteria up front, since "done" means something different to everyone.

I can go deeper on any of these, or you can point me at a specific task.`;
  }
}
