import { initToolRegistry, listTools } from "@/lib/server/tools/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  initToolRegistry();
  return Response.json({ success: true, data: listTools() });
}
