import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { store } from "@/lib/server/store";
import { listTools } from "@/lib/server/tools/registry";
import { fail, ok, readJson } from "@/lib/server/http";
import type { Agent } from "@/lib/shared/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return ok(store.listAgents());
}

export async function POST(req: NextRequest) {
  const body = await readJson(req);

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return fail("invalid_request", "name is required");
  }

  const knownTools = new Set(listTools().map((t) => t.name.toLowerCase()));
  const skills = Array.isArray(body.skills)
    ? (body.skills as unknown[]).filter((s): s is string => typeof s === "string")
    : [];
  const tools = Array.isArray(body.tools)
    ? (body.tools as unknown[]).filter(
        (t): t is string => typeof t === "string" && knownTools.has(t.toLowerCase())
      )
    : [];

  const agent: Agent = {
    id: randomUUID(),
    name,
    description: typeof body.description === "string" ? body.description.trim() : "",
    skills,
    tools,
    isDefault: false,
    createdAt: new Date().toISOString(),
  };

  return ok(store.createAgent(agent));
}
