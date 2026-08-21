import { NextRequest } from "next/server";
import { store } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const conversation = store.getConversation(id);
  if (!conversation) {
    return Response.json(
      { success: false, error: { code: "not_found", message: "Conversation not found" } },
      { status: 404 }
    );
  }
  return Response.json({
    success: true,
    data: { conversation, messages: store.listMessages(id) },
  });
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  store.deleteConversation(id);
  return Response.json({ success: true, data: { id } });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const conversation = store.getConversation(id);
  if (!conversation) {
    return Response.json(
      { success: false, error: { code: "not_found", message: "Conversation not found" } },
      { status: 404 }
    );
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

  return Response.json({ success: true, data: store.getConversation(id) });
}
