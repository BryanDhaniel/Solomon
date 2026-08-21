import { listSkills } from "@/lib/server/skills";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ success: true, data: listSkills() });
}
