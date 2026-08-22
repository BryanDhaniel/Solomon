import type { Agent, Message, Plan, StepResult, ToolDefinition } from "@/lib/shared/types";

export type Attachment = {
  name: string;
  content: string;
};

/** Full markdown content of one Skill — what ADR-0001 means by wholesale injection. */
export type SkillContent = {
  name: string;
  title: string;
  body: string;
};

export type PlanContext = {
  input: string;
  agent: Agent;
  attachment?: Attachment;
  /** Messages strictly before the current turn, oldest first. */
  history: Pick<Message, "role" | "content">[];
  /** Definitions of the Tools this Agent owns — adapters emit calls against these. */
  tools: ToolDefinition[];
  /** The Agent's Skills, injected whole (ADR-0001). No relevance selection. */
  skills: SkillContent[];
};

export type ComposeContext = {
  agent?: Agent;
  skills?: SkillContent[];
};

export interface LLM {
  readonly name: string;
  /** Decompose a user request into an executable plan of steps, using only the agent's tools. */
  createPlan(ctx: PlanContext): Promise<Plan>;
  /** Compose a final assistant response from the request, its step results, and the agent's context. */
  composeResponse(input: string, results: StepResult[], ctx?: ComposeContext): Promise<string>;
}
