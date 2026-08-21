import type { Plan, StepResult } from "@/lib/shared/types";

export interface LLM {
  readonly name: string;
  /** Decompose a user request into an executable plan of steps. */
  createPlan(input: string): Promise<Plan>;
  /** Compose a final assistant response from the plan and its step results. */
  composeResponse(input: string, results: StepResult[]): Promise<string>;
}
