import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { store } from "@/lib/server/store";
import { createPlan } from "@/lib/server/planner";
import { runExecution } from "@/lib/server/execution-engine";
import { fail, readJson } from "@/lib/server/http";
import { encodeEvent, type ServerEvent } from "@/lib/server/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function titleFromContent(content: string): string {
  const first = content.split(/\s+/).slice(0, 6).join(" ");
  return first.length > 48 ? `${first.slice(0, 48)}…` : first || "New chat";
}

export async function POST(req: NextRequest) {
  const body = await readJson(req);

  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content) {
    return fail("invalid_request", "content is required");
  }

  let attachment: { name: string; content: string } | undefined;
  if (
    body.attachment &&
    typeof body.attachment === "object" &&
    typeof (body.attachment as Record<string, unknown>).name === "string" &&
    typeof (body.attachment as Record<string, unknown>).content === "string"
  ) {
    attachment = body.attachment as { name: string; content: string };
  }

  const requestedAgentId =
    typeof body.agentId === "string" && body.agentId ? body.agentId : null;
  const agent =
    (requestedAgentId ? store.getAgent(requestedAgentId) : undefined) ??
    store.getDefaultAgent();
  if (!agent) {
    return fail("service_unavailable", "No Agent available", 503);
  }

  const now = new Date().toISOString();

  let conversation = typeof body.conversationId === "string"
    ? store.getConversation(body.conversationId)
    : undefined;

  let created = false;
  if (!conversation) {
    conversation = store.createConversation(randomUUID(), titleFromContent(content), now, agent?.id ?? null);
    created = true;
  } else {
    store.touchConversation(conversation.id, now);
  }

  store.addMessage(randomUUID(), conversation.id, "user", content, now);

  const assistantMessageId = randomUUID();
  const execution = store.createExecution(randomUUID(), conversation.id, now);
  const plan = await createPlan({
    conversationId: conversation.id,
    input: content,
    agent,
    attachment,
  });

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
            agent,
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
