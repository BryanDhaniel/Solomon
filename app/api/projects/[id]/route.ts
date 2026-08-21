import { NextRequest } from "next/server";
import { store } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  store.deleteProject(id);
  return Response.json({ success: true, data: { id } });
}
