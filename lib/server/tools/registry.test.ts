import { describe, expect, it } from "vitest";
import { getTool, listTools } from "./registry";

describe("tool registry — self-initializing", () => {
  it("exposes all four registered Tools without an init call", () => {
    const names = listTools().map((d) => d.name.toLowerCase()).sort();
    expect(names).toEqual(["browse", "code_review", "gmail", "search"]);
  });

  it("resolves tools case-insensitively", () => {
    expect(getTool("GMAIL")).toBeDefined();
    expect(getTool("nope")).toBeUndefined();
  });
});
