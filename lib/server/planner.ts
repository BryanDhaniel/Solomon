import { store } from "./store";
import { listTools } from "./tools/registry";
import { getSkillContents } from "./skills";
import { createDefaultLlm } from "./llm/index";
import type { Attachment, LLM, PlanContext } from "./llm/types";
import type { Agent, Plan } from "@/lib/shared/types";

/**
 * The Planner is the seam between the request pipeline and the language model.
 * The provider is selected once via LLM_PROVIDER (see llm/index.ts) — swapping
 * adapters never touches callers or the execution engine.
 */
let llm: LLM | null = null;

export function getLlm(): LLM {
  if (!llm) llm = createDefaultLlm();
  return llm;
}

export type PlanRequest = {
  conversationId?: string;
  input: string;
  agent: Agent;
  attachment?: Attachment;
};

/**
 * Gathers everything an adapter needs — conversation history, the Agent's own
 * Tool definitions, and its Skills' full content — so adapters never reach
 * around the seam into the registry, store, or filesystem.
 */
export function buildPlanContext({
  conversationId,
  input,
  agent,
  attachment,
}: PlanRequest): PlanContext {
  const owned = new Set(agent.tools.map((t) => t.toLowerCase()));
  const tools = listTools().filter((d) => owned.has(d.name.toLowerCase()));

  const allMessages = conversationId ? store.listMessages(conversationId) : [];
  const history = allMessages
    // The route persists the user turn before planning; keep messages strictly before it.
    .slice(0, allMessages.length && allMessages[allMessages.length - 1].content === input ? -1 : undefined)
    .map(({ role, content }) => ({ role, content }));

  return {
    input,
    agent,
    attachment,
    history,
    tools,
    skills: getSkillContents(agent.skills),
  };
}

export async function createPlan(req: PlanRequest): Promise<Plan> {
  const ctx = buildPlanContext(req);
  return getLlm().createPlan(ctx);
}
