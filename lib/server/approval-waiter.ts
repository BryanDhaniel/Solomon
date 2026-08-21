export type ApprovalDecision = "approved" | "rejected";

type Waiter = {
  resolve: (value: ApprovalDecision) => void;
  reject: (err: Error) => void;
  onAbort?: () => void;
};

const waiters = new Map<string, Waiter>();

/**
 * Blocks an in-flight execution until a human resolves the pending approval
 * via the /api/approvals endpoint. The SSE stream stays open while waiting.
 */
export function waitForApproval(
  id: string,
  signal?: AbortSignal
): Promise<ApprovalDecision> {
  return new Promise<ApprovalDecision>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Execution aborted"));
      return;
    }

    const onAbort = () => {
      waiters.delete(id);
      reject(new Error("Execution aborted"));
    };

    if (signal) signal.addEventListener("abort", onAbort, { once: true });

    waiters.set(id, {
      resolve: (value) => {
        if (signal) signal.removeEventListener("abort", onAbort);
        waiters.delete(id);
        resolve(value);
      },
      reject: (err) => {
        if (signal) signal.removeEventListener("abort", onAbort);
        waiters.delete(id);
        reject(err);
      },
      onAbort,
    });
  });
}

export function signalApproval(id: string, decision: ApprovalDecision): boolean {
  const waiter = waiters.get(id);
  if (!waiter) return false;
  waiter.resolve(decision);
  return true;
}
