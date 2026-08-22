import type { Agent, Step } from "@/lib/shared/types";

/**
 * ADR-0001: the planner may only plan actions for Tools the Agent owns.
 * Pure policy check so ownership is enforced structurally, not by adapter
 * discipline. Fails open only when no Agent is known; callers resolve one.
 */
export function stepIsAllowed(step: Pick<Step, "tool">, agent?: Agent): boolean {
  const tool = (step.tool ?? "").toLowerCase();
  if (!tool) return false;
  if (!agent) return true;
  return agent.tools.some((t) => t.toLowerCase() === tool);
}
