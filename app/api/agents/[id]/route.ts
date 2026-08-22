import { NextRequest } from "next/server";
import { store } from "@/lib/server/store";
import { fail, ok, readJson } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const agent = store.getAgent(id);
  if (!agent) {
    return fail("not_found", "Agent not found", 404);
  }
  return ok(agent);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await readJson(req);

  const fields: Partial<Pick<import("@/lib/shared/types").Agent, "name" | "description" | "skills" | "tools">> = {};
  if (typeof body.name === "string" && body.name.trim()) fields.name = body.name.trim();
  if (typeof body.description === "string") fields.description = body.description.trim();
  if (Array.isArray(body.skills)) {
    fields.skills = (body.skills as unknown[]).filter((s): s is string => typeof s === "string");
  }

  const agent = store.updateAgent(id, fields);
  if (!agent) {
    return fail("not_found", "Agent not found", 404);
  }
  return ok(agent);
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const deleted = store.deleteAgent(id);
  if (!deleted) {
    return fail("forbidden", "The default Agent cannot be deleted", 403);
  }
  return ok({ id });
}
