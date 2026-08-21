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
