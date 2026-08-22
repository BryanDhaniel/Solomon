import { listTools } from "@/lib/server/tools/registry";
import { ok } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return ok(listTools());
}
