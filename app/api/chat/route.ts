import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { store } from "@/lib/server/store";
import { initToolRegistry } from "@/lib/server/tools/registry";
import { createPlan } from "@/lib/server/planner";
import { runExecution } from "@/lib/server/execution-engine";
import { encodeEvent, type ServerEvent } from "@/lib/server/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function titleFromContent(content: string): string {
  const first = content.split(/\s+/).slice(0, 6).join(" ");
  return first.length > 48 ? `${first.slice(0, 48)}…` : first || "New chat";
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content) {
    return Response.json(
      { success: false, error: { code: "invalid_request", message: "content is required" } },
      { status: 400 }
    );
  }

  initToolRegistry();
  const now = new Date().toISOString();

  let conversation = typeof body.conversationId === "string"
    ? store.getConversation(body.conversationId)
    : undefined;

  let created = false;
  if (!conversation) {
    conversation = store.createConversation(randomUUID(), titleFromContent(content), now);
    created = true;
  } else {
    store.touchConversation(conversation.id, now);
  }

  store.addMessage(randomUUID(), conversation.id, "user", content, now);

  const assistantMessageId = randomUUID();
  const execution = store.createExecution(randomUUID(), conversation.id, now);
  const plan = await createPlan(content);

  const stream = new ReadableStream({
    start(controller) {
      const emit = (evt: ServerEvent) => {
        try {
          controller.enqueue(new TextEncoder().encode(encodeEvent(evt)));
        } catch {
          /* stream already closed */
        }
      };

      (async () => {
        try {
          if (created) {
            emit({
              event: "conversation.created",
              data: { conversationId: conversation.id, title: conversation.title },
            });
          }
          const result = await runExecution(execution.id, content, plan, {
            emit,
            signal: req.signal,
            assistantMessageId,
          });
          if (result.finalText) {
            store.addMessage(
              assistantMessageId,
              conversation.id,
              "assistant",
              result.finalText,
              new Date().toISOString()
            );
          }
        } catch (err) {
          emit({
            event: "execution.error",
            data: {
              executionId: execution.id,
              error: err instanceof Error ? err.message : String(err),
            },
          });
        } finally {
          try {
            controller.close();
          } catch {
            /* ignore */
          }
        }
      })();
    },
    cancel() {
      /* client disconnected; req.signal will propagate */
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
