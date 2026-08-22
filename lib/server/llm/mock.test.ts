import { describe, expect, it } from "vitest";
import { MockLLM } from "./mock";
import type { PlanContext } from "./types";
import type { Agent, ToolDefinition } from "@/lib/shared/types";

const def = (name: string): ToolDefinition => ({
  name,
  description: `${name} definition`,
  actions: [],
  permissions: [],
});

const agentWith = (tools: string[]): Agent => ({
  id: "a1",
  name: "Test Agent",
  description: "",
  skills: [],
  tools,
  isDefault: false,
  createdAt: "2026-01-01T00:00:00Z",
});

const ctx = (input: string, tools: string[], skills: PlanContext["skills"] = []): PlanContext => {
  const agent = agentWith(tools);
  return {
    input,
    agent,
    attachment: undefined,
    history: [],
    tools: tools.map(def),
    skills,
  };
};

describe("MockLLM.createPlan — plans only owned Tools", () => {
  it("plans a search tool_call when the Agent owns `search`", async () => {
    const plan = await new MockLLM().createPlan(ctx("Research the latest AI agents", ["search"]));
    const call = plan.steps.find((s) => s.type === "tool_call");
    expect(call?.tool).toBe("search");
  });

  it("never plans a Tool the Agent lacks — email without gmail falls back to respond", async () => {
    const plan = await new MockLLM().createPlan(
      ctx("Email bob@example.com saying hi", ["search"])
    );
    expect(plan.steps.some((s) => s.type === "tool_call")).toBe(false);
    expect(plan.steps.some((s) => s.type === "respond")).toBe(true);
  });
});

describe("MockLLM.composeResponse", () => {
  it("renders search results from step results", async () => {
    const text = await new MockLLM().composeResponse("q", [
      {
        stepId: "1",
        description: "searching",
        tool: "search",
        action: "search",
        result: { results: [{ title: "Result", url: "https://x.dev", snippet: "snip" }] },
      },
    ]);
    expect(text).toContain("[Result](https://x.dev)");
  });

  it("surfaces injected Skills in prose replies", async () => {
    const text = await new MockLLM().composeResponse("hello there", [], {
      skills: [{ name: "how-to-research", title: "How To Research", body: "# How To Research\n\nStart with primary sources." }],
    });
    expect(text).toContain("How To Research");
    expect(text).toContain("primary sources");
  });
});
