import { describe, expect, it } from "vitest";
import { stepIsAllowed } from "./step-policy";
import type { Agent } from "@/lib/shared/types";

const agentWith = (tools: string[]): Agent => ({
  id: "a1",
  name: "Test Agent",
  description: "",
  skills: [],
  tools,
  isDefault: false,
  createdAt: "2026-01-01T00:00:00Z",
});

describe("stepIsAllowed — ADR-0001 ownership policy", () => {
  it("allows steps whose tool the Agent owns (case-insensitive)", () => {
    expect(stepIsAllowed({ tool: "Gmail" }, agentWith(["gmail", "search"]))).toBe(true);
  });

  it("rejects tools the Agent does not own", () => {
    expect(stepIsAllowed({ tool: "gmail" }, agentWith(["search"]))).toBe(false);
  });

  it("rejects steps without a tool", () => {
    expect(stepIsAllowed({ tool: undefined }, agentWith(["search"]))).toBe(false);
  });

  it("fails open when no Agent is known", () => {
    expect(stepIsAllowed({ tool: "anything" }, undefined)).toBe(true);
  });
});
