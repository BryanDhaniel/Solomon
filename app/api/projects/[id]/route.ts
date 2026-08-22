import { NextRequest } from "next/server";
import { store } from "@/lib/server/store";
import { ok } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  store.deleteProject(id);
  return ok({ id });
}
