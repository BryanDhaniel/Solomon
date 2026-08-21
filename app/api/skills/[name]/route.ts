import { NextRequest } from "next/server";
import { getSkill } from "@/lib/server/skills";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ name: string }> }
) {
  const { name } = await context.params;
  const skill = getSkill(name);
  if (!skill) {
    return Response.json(
      { success: false, error: { code: "not_found", message: "Skill not found" } },
      { status: 404 }
    );
  }
  return Response.json({ success: true, data: skill });
}
