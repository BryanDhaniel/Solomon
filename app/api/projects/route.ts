import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { store } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ success: true, data: store.listProjects() });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return Response.json(
      { success: false, error: { code: "invalid_request", message: "name is required" } },
      { status: 400 }
    );
  }
  const project = store.createProject(randomUUID(), name, new Date().toISOString());
  return Response.json({ success: true, data: project });
}
