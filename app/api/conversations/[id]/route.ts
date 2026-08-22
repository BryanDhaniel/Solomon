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
  const conversation = store.getConversation(id);
  if (!conversation) {
    return fail("not_found", "Conversation not found", 404);
  }
  return ok({ conversation, messages: store.listMessages(id) });
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  store.deleteConversation(id);
  return ok({ id });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await readJson(req);

  const conversation = store.getConversation(id);
  if (!conversation) {
    return fail("not_found", "Conversation not found", 404);
  }

  if (typeof body.pinned === "boolean") {
    store.setPinned(id, body.pinned);
  }

  if (typeof body.title === "string" && body.title.trim()) {
    store.setTitle(id, body.title.trim());
  }

  if ("projectId" in body) {
    const projectId = typeof body.projectId === "string" ? body.projectId : null;
    store.setProject(id, projectId);
  }

  return ok(store.getConversation(id));
}
