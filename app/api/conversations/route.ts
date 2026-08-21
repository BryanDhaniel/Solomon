import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { store } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ success: true, data: store.listConversations() });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const title = typeof body.title === "string" && body.title.trim()
    ? body.title.trim()
    : "New chat";
  const conversation = store.createConversation(
    randomUUID(),
    title,
    new Date().toISOString()
  );
  return Response.json({ success: true, data: conversation });
}
