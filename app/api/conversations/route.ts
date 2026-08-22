import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { store } from "@/lib/server/store";
import { ok, readJson } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return ok(store.listConversations());
}

export async function POST(req: NextRequest) {
  const body = await readJson(req);
  const title =
    typeof body.title === "string" && body.title.trim() ? body.title.trim() : "New chat";
  const conversation = store.createConversation(
    randomUUID(),
    title,
    new Date().toISOString()
  );
  return ok(conversation);
}
