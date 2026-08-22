import { describe, expect, it } from "vitest";
import { fail, ok, readJson } from "./http";
import type { NextRequest } from "next/server";

const fakeReq = (body: unknown) =>
  ({
    json: typeof body === "function" ? (body as () => Promise<unknown>) : () => Promise.resolve(body),
  }) as unknown as NextRequest;

describe("wire contract helpers", () => {
  it("ok() wraps data in the success envelope", async () => {
    const res = ok({ id: "1" });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true, data: { id: "1" } });
  });

  it("fail() wraps code+message in the error envelope", async () => {
    const res = fail("not_found", "Agent not found", 404);
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({
      success: false,
      error: { code: "not_found", message: "Agent not found" },
    });
  });

  it("readJson() parses valid JSON bodies", async () => {
    await expect(readJson(fakeReq({ name: "x" }))).resolves.toEqual({ name: "x" });
  });

  it("readJson() degrades malformed bodies to an empty object", async () => {
    await expect(readJson(fakeReq(() => Promise.reject(new Error("bad json"))))).resolves.toEqual({});
  });
});
