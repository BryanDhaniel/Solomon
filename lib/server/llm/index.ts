import type { LLM } from "./types";
import { MockLLM } from "./mock";

/**
 * Composition root for the LLM seam. Providers register here; selection is
 * configuration, never a hand-edit of call sites.
 *
 * Add a real provider as a new case (e.g. `case "openai": return new OpenAILLM();`).
 */
export function createDefaultLlm(): LLM {
  const provider = (process.env.LLM_PROVIDER ?? "mock").toLowerCase();
  switch (provider) {
    case "mock":
      return new MockLLM();
    default:
      throw new Error(`Unknown LLM_PROVIDER "${provider}" — no adapter registered for it`);
  }
}
