import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { store } from "@/lib/server/store";
import { fail, ok, readJson } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return ok(store.listProjects());
}

export async function POST(req: NextRequest) {
  const body = await readJson(req);
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return fail("invalid_request", "name is required");
  }
  const project = store.createProject(randomUUID(), name, new Date().toISOString());
  return ok(project);
}
