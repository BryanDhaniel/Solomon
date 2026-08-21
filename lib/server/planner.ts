import type { LLM } from "./llm/types";
import { MockLLM } from "./llm/mock";
import type { Plan } from "@/lib/shared/types";

/**
 * The Planner is the swappable boundary between the request pipeline and the
 * underlying language model. Swap `llm` for a real provider (OpenAI Responses
 * API, Anthropic, etc.) without touching the execution engine.
 */
let llm: LLM = new MockLLM();

export function getLlm(): LLM {
  return llm;
}

export function setLlm(next: LLM): void {
  llm = next;
}

export async function createPlan(input: string): Promise<Plan> {
  return getLlm().createPlan(input);
}
