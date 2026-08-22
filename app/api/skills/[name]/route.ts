import { NextRequest } from "next/server";
import { getSkill } from "@/lib/server/skills";
import { fail, ok } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ name: string }> }
) {
  const { name } = await context.params;
  const skill = getSkill(name);
  if (!skill) {
    return fail("not_found", "Skill not found", 404);
  }
  return ok(skill);
}
