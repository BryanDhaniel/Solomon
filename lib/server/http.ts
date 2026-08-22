import { NextRequest } from "next/server";

/**
 * The wire contract: every JSON endpoint speaks `{ success: true, data }` or
 * `{ success: false, error: { code, message } }`. These helpers are its single
 * definition — routes must not hand-roll envelope literals.
 */

export async function readJson(
  req: NextRequest
): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export function ok(data: unknown, status = 200): Response {
  return Response.json({ success: true, data }, { status });
}

export function fail(
  code: string,
  message: string,
  status = 400
): Response {
  return Response.json(
    { success: false, error: { code, message } },
    { status }
  );
}
