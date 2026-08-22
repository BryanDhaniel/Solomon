import { listSkills } from "@/lib/server/skills";
import { ok } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return ok(listSkills());
}
