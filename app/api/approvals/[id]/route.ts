import { NextRequest } from "next/server";
import { store } from "@/lib/server/store";
import { signalApproval } from "@/lib/server/approval-waiter";
import { fail, ok, readJson } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await readJson(req);

  const decision = body.decision === "approved" ? "approved" : "rejected";

  const approval = store.getApproval(id);
  if (!approval) {
    return fail("not_found", "Approval not found", 404);
  }
  if (approval.status !== "pending") {
    return fail("invalid_request", "Approval already resolved", 409);
  }

  store.resolveApproval(id, decision, new Date().toISOString());
  signalApproval(id, decision);

  return ok({ id, status: decision });
}
