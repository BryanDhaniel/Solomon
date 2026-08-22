import { describe, expect, it } from "vitest";
import { buildPlanContext } from "./planner";
import type { Agent } from "@/lib/shared/types";

const agentWith = (tools: string[], skills: string[]): Agent => ({
  id: "a1",
  name: "Test Agent",
  description: "",
  skills,
  tools,
  isDefault: false,
  createdAt: "2026-01-01T00:00:00Z",
});

describe("buildPlanContext", () => {
  it("supplies only the Tool definitions the Agent owns", () => {
    const ctx = buildPlanContext({ input: "hi", agent: agentWith(["search"], []) });
    expect(ctx.tools.map((d) => d.name.toLowerCase())).toEqual(["search"]);
    expect(ctx.history).toEqual([]);
  });

  it("injects the full content of the Agent's Skills (ADR-0001)", () => {
    const ctx = buildPlanContext({
      input: "hi",
      agent: agentWith([], ["how-to-research"]),
    });
    expect(ctx.skills).toHaveLength(1);
    expect(ctx.skills[0].name).toBe("how-to-research");
    expect(ctx.skills[0].body.length).toBeGreaterThan(0);
  });

  it("skips unknown skill names instead of failing", () => {
    const ctx = buildPlanContext({ input: "hi", agent: agentWith([], ["nope"]) });
    expect(ctx.skills).toEqual([]);
  });
});
