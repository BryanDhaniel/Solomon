import { NextRequest } from "next/server";
import { store } from "@/lib/server/store";
import { signalApproval } from "@/lib/server/approval-waiter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const decision = body.decision === "approved" ? "approved" : "rejected";

  const approval = store.getApproval(id);
  if (!approval) {
    return Response.json(
      { success: false, error: { code: "not_found", message: "Approval not found" } },
      { status: 404 }
    );
  }
  if (approval.status !== "pending") {
    return Response.json(
      { success: false, error: { code: "invalid_request", message: "Approval already resolved" } },
      { status: 409 }
    );
  }

  store.resolveApproval(id, decision, new Date().toISOString());
  signalApproval(id, decision);

  return Response.json({ success: true, data: { id, status: decision } });
}
