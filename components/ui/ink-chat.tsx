"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  ArrowUp,
  RotateCcw,
  Square,
  Copy,
  Check,
  Paperclip,
  Circle,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  ShieldAlert,
  Terminal,
  X,
  Files,
  FolderOpen,
  FolderPlus,
  FileText,
} from "lucide-react";
import { RenderMarkdown } from "@/components/ui/markdown";
import BrandMark from "@/components/ui/brand-mark";

/* ─── Types ──────────────────────────────────── */
type Role = "user" | "assistant";

type Message = {
  id: string;
  role: Role;
  content: string;
  time?: string;
};

type StepStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "awaiting_approval";

type TimelineStep = {
  id: string;
  index: number;
  description: string;
  status: StepStatus;
  tool?: string;
  action?: string;
  result?: unknown;
};

type ApprovalState = {
  approvalId: string;
  tool: string;
  action: string;
  description: string;
};

type ServerEvent = {
  event: string;
  data: Record<string, unknown>;
};

/* ─── Prompt starters ────────────────────────── */
const starters = [
  {
    icon: Files,
    label: "List workspace files",
    hint: "See what's stored",
    prompt: "List the files in my workspace",
  },
  {
    icon: FileText,
    label: "Write a note",
    hint: "Create notes.txt",
    prompt: "Write a file named notes.txt with a hello message",
  },
  {
    icon: FolderPlus,
    label: "Create a folder",
    hint: "Organize into reports",
    prompt: "Create a folder called reports",
  },
  {
    icon: FolderOpen,
    label: "Read a file",
    hint: "Open notes.txt",
    prompt: "Read the file notes.txt",
  },
];

/* ─── Copy hook ──────────────────────────────── */
function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const exec = useCallback((id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  }, []);
  return { copied, exec };
}

/* ═══════════════════════════════════════════════
   INK CHAT
   ═══════════════════════════════════════════════ */
type InkChatProps = {
  conversationId?: string | null;
  onConversationCreated?: (id: string, title: string) => void;
  onNewChat?: () => void;
};

export default function InkChat({
  conversationId: initialConversationId,
  onConversationCreated,
  onNewChat,
}: InkChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [timeline, setTimeline] = useState<TimelineStep[]>([]);
  const [approval, setApproval] = useState<ApprovalState | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId ?? null
  );
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const assistantIdRef = useRef<string | null>(null);

  const { copied, exec } = useCopy();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, timeline, approval]);

  useEffect(() => {
    if (!initialConversationId) return;
    let cancelled = false;
    fetch(`/api/conversations/${initialConversationId}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled || !json.success) return;
        const msgs = (json.data?.messages ?? []).map(
          (m: { id: string; role: Role; content: string; createdAt?: string }) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            time: m.createdAt
              ? new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
              : undefined,
          })
        );
        setMessages(msgs);
        setConversationId(initialConversationId);
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      cancelled = true;
    };
  }, [initialConversationId]);

  const resize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  };

  const appendAssistantChunk = useCallback((text: string) => {
    const id = assistantIdRef.current;
    if (!id) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content: m.content + text } : m))
    );
  }, []);

  const upsertStep = useCallback(
    (step: TimelineStep) => {
      setTimeline((prev) => {
        const idx = prev.findIndex((s) => s.id === step.id);
        if (idx === -1) {
          const next = [...prev, step];
          next.sort((a, b) => a.index - b.index);
          return next;
        }
        const next = [...prev];
        next[idx] = { ...next[idx], ...step };
        return next;
      });
    },
    []
  );

  const handleEvent = useCallback(
    (evt: ServerEvent) => {
      const data = evt.data;
      switch (evt.event) {
        case "conversation.created": {
          if (typeof data.conversationId === "string") {
            setConversationId(data.conversationId);
            onConversationCreated?.(
              data.conversationId,
              typeof data.title === "string" ? data.title : "New chat"
            );
          }
          break;
        }
        case "execution.step": {
          const id = String(data.stepId ?? "");
          const index = Number(data.index ?? 0);
          const description = String(data.description ?? "");
          const status = (data.status as StepStatus) ?? "pending";
          upsertStep({ id, index, description, status });
          break;
        }
        case "execution.tool_call": {
          const id = String(data.stepId ?? "");
          const index = Number(data.index ?? 0);
          upsertStep({
            id,
            index,
            description: String(data.description ?? ""),
            status: "running",
            tool: String(data.tool ?? ""),
            action: String(data.action ?? ""),
          });
          break;
        }
        case "execution.tool_result": {
          const id = String(data.stepId ?? "");
          upsertStep({
            id,
            index: 0,
            description: "",
            status: data.success ? "completed" : "failed",
            result: data.result,
          });
          break;
        }
        case "execution.approval_required": {
          const stepId = String(data.stepId ?? "");
          setApproval({
            approvalId: String(data.approvalId ?? ""),
            tool: String(data.tool ?? ""),
            action: String(data.action ?? ""),
            description: String(data.description ?? ""),
          });
          upsertStep({
            id: stepId,
            index: 0,
            description: "",
            status: "awaiting_approval",
          });
          break;
        }
        case "message.chunk": {
          appendAssistantChunk(String(data.text ?? ""));
          break;
        }
        case "message.complete": {
          const id = assistantIdRef.current;
          if (id && typeof data.fullText === "string") {
            setMessages((prev) =>
              prev.map((m) => (m.id === id ? { ...m, content: data.fullText as string } : m))
            );
          }
          break;
        }
        case "execution.completed": {
          setBusy(false);
          break;
        }
        case "execution.error": {
          if (data.code === "approval_rejected") {
            setApproval(null);
            setBusy(false);
            const id = assistantIdRef.current;
            if (id) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === id ? { ...m, content: "Cancelled — the action was rejected." } : m
                )
              );
            }
          } else {
            appendAssistantChunk(`\n\n> ${data.error ?? "Something went wrong."}`);
          }
          break;
        }
      }
    },
    [appendAssistantChunk, upsertStep, onConversationCreated]
  );

  const send = useCallback(
    async (text?: string) => {
      const content = (text || input).trim();
      if (!content || busy) return;

      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      setTimeline([]);
      setApproval(null);
      setBusy(true);

      const userId = `u-${Date.now()}`;
      const assistantId = `a-${Date.now()}`;
      assistantIdRef.current = assistantId;
      const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

      setMessages((prev) => [
        ...prev,
        { id: userId, role: "user", content, time },
        { id: assistantId, role: "assistant", content: "", time },
      ]);

      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, conversationId }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(`Request failed (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";
          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith("data:")) continue;
            const json = line.slice(5).trim();
            if (!json) continue;
            try {
              handleEvent(JSON.parse(json) as ServerEvent);
            } catch {
              /* ignore malformed frames */
            }
          }
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          appendAssistantChunk(
            `\n\n> ${err instanceof Error ? err.message : "Connection lost."}`
          );
        }
      } finally {
        setBusy(false);
        assistantIdRef.current = null;
        controllerRef.current = null;
      }
    },
    [input, busy, conversationId, handleEvent, appendAssistantChunk]
  );

  const respondApproval = useCallback(
    async (decision: "approved" | "rejected") => {
      if (!approval) return;
      const id = approval.approvalId;
      setApproval(null);
      try {
        await fetch(`/api/approvals/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision }),
        });
      } catch {
        /* the stream will surface any failure */
      }
    },
    [approval]
  );

  const stop = useCallback(() => {
    controllerRef.current?.abort();
    setBusy(false);
  }, []);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const lastUserIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") return i;
    }
    return -1;
  })();

  /* ─── EMPTY STATE ─────────────────────────── */
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <Image
            src="/ink-mountains.jpg"
            alt=""
            fill
            priority
            className="ink-hero-img object-cover object-top"
          />
        </div>

        <div className="relative flex-1 flex flex-col items-center justify-center px-6 pb-4">
          <div className="mb-8 flex flex-col items-center text-center">
            {/* <BrandMark size={44} className="mb-5 drop-shadow-[0_2px_6px_oklch(0.12_0_0/0.18)]" /> */}
            <p className="text-[30px] font-semibold text-foreground tracking-tight leading-tight">
              What shall Solomon finish for you today?
            </p>
            <p className="text-[14px] text-muted-foreground mt-2 max-w-md">
              Ask, and I&apos;ll plan and execute it — with your approval for irreversible actions.
            </p>
          </div>

          <div className="w-full max-w-[640px]">
            <div className="flex items-end gap-2 bg-card border border-border/60 rounded-2xl px-3 py-3 transition-colors focus-within:border-ink-stone/40 shadow-sm">
              <button
                className="shrink-0 p-2 rounded-xl text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/30 transition-colors self-end"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" strokeWidth={2} />
              </button>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  resize(e.target);
                }}
                onKeyDown={onKey}
                placeholder="Message Solomon..."
                rows={1}
                className="flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/40 outline-none resize-none leading-relaxed min-h-[28px] max-h-[180px] py-1"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim()}
                className={`shrink-0 p-2 rounded-xl transition-all duration-150 self-end ${
                  input.trim()
                    ? "bg-foreground text-background hover:opacity-80"
                    : "bg-muted/60 text-muted-foreground/40 cursor-not-allowed"
                }`}
              >
                <ArrowUp className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-5">
              {starters.map((s, i) => (
                <button
                  key={i}
                  onClick={() => send(s.prompt)}
                  className="ink-card group flex items-center gap-3 p-3 rounded-xl text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-foreground/[0.05] dark:bg-foreground/[0.07] flex items-center justify-center shrink-0">
                    <s.icon
                      className="w-4 h-4 text-ink-stone group-hover:text-ink-deep dark:group-hover:text-ink-paper transition-colors"
                      strokeWidth={1.5}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-foreground truncate">{s.label}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{s.hint}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="relative text-[11px] text-muted-foreground/40 text-center pb-4">
          Solomon can make mistakes. Check important info.
        </p>
      </div>
    );
  }

  /* ─── CONVERSATION ─────────────────────────── */
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-[720px] mx-auto px-5 py-8">
          {messages.map((msg, i) => {
            const isLastUser = i === lastUserIndex;
            return (
              <React.Fragment key={msg.id}>
                {msg.role === "user" ? (
                  <div className="flex justify-end mb-7">
                    <div className="max-w-[80%] flex flex-col items-end">
                      <div className="bg-ink-deep/[0.06] dark:bg-ink-paper/[0.07] border border-ink-deep/5 dark:border-ink-paper/5 rounded-2xl rounded-br-md px-4 py-3">
                        <p className="text-[15px] text-foreground leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div>
                      {msg.time && (
                        <span className="text-[10px] text-muted-foreground/40 mt-1 mr-1">
                          {msg.time}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mb-8 group">
                    <div className="flex items-center gap-2 mb-3">
                      <BrandMark size={20} className="rounded-[5px]" />
                      <span className="text-[13px] font-medium text-foreground">Solomon</span>
                      {msg.time && (
                        <span className="text-[10px] text-muted-foreground/40">{msg.time}</span>
                      )}
                    </div>

                    <div className="pl-7">
                      {msg.content ? (
                        <div className="text-[15px] text-foreground/85 leading-[1.7]">
                          <RenderMarkdown content={msg.content} />
                        </div>
                      ) : (
                        busy && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="inline-block w-4 h-4 rounded-full border-2 border-ink-stone/30 border-t-ink-stone animate-spin" />
                            <span className="text-[13px]">Thinking…</span>
                          </div>
                        )
                      )}

                      {msg.content && !(busy && i === messages.length - 1) && (
                        <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => exec(msg.id, msg.content)}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/30 transition-colors"
                          >
                            {copied === msg.id ? (
                              <Check className="w-3 h-3" strokeWidth={2} />
                            ) : (
                              <Copy className="w-3 h-3" strokeWidth={2} />
                            )}
                            {copied === msg.id ? "Copied" : "Copy"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {isLastUser && timeline.length > 0 && (
                  <Timeline steps={timeline} />
                )}

                {isLastUser && approval && (
                  <ApprovalCard approval={approval} onRespond={respondApproval} />
                )}
              </React.Fragment>
            );
          })}

          <div ref={endRef} />
        </div>
      </div>

      {/* ── Input bar ────────────────────────── */}
      <div className="shrink-0 px-4 pb-4 pt-2">
        <div className="max-w-[720px] mx-auto">
          <div className="flex items-end gap-2 bg-card border border-border/60 rounded-2xl px-3 py-3 transition-colors focus-within:border-ink-stone/40 shadow-sm">
            <button
              className="shrink-0 p-2 rounded-xl text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/30 transition-colors self-end"
              title="Attach file"
            >
              <Paperclip className="w-4 h-4" strokeWidth={2} />
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                resize(e.target);
              }}
              onKeyDown={onKey}
              placeholder="Reply..."
              rows={1}
              className="flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/40 outline-none resize-none leading-relaxed min-h-[28px] max-h-[180px] py-1"
            />
            <div className="flex items-center gap-1 shrink-0 self-end">
              <button
                onClick={onNewChat}
                className="p-2 rounded-xl text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/30 transition-colors"
                title="New chat"
              >
                <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
              {busy ? (
                <button
                  onClick={stop}
                  className="p-2 rounded-xl bg-foreground text-background hover:opacity-80 transition-opacity"
                  title="Stop"
                >
                  <Square className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              ) : (
                <button
                  onClick={() => send()}
                  disabled={!input.trim()}
                  className={`p-2 rounded-xl transition-all duration-150 ${
                    input.trim()
                      ? "bg-foreground text-background hover:opacity-80"
                      : "bg-muted/60 text-muted-foreground/40 cursor-not-allowed"
                  }`}
                >
                  <ArrowUp className="w-4 h-4" strokeWidth={2} />
                </button>
              )}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground/40 text-center mt-2">
            Solomon can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Execution timeline ─────────────────────── */
function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div className="mb-6 pl-7">
      <div className="ink-card rounded-xl px-4 py-3.5">
        <div className="flex flex-col">
          {steps.map((step, i) => {
            const isLast = i === steps.length - 1;
            return (
              <div key={step.id} className="relative flex items-start gap-3">
                <div className="flex flex-col items-center shrink-0 pt-0.5">
                  <StepIcon status={step.status} />
                  {!isLast && (
                    <span className="w-px flex-1 min-h-[14px] my-0.5 bg-ink-dry/50 dark:bg-ink-dry/25" />
                  )}
                </div>
                <div className="flex-1 min-w-0 flex items-center justify-between gap-2 py-1">
                  <span
                    className={`text-[13px] truncate ${
                      step.status === "failed"
                        ? "text-ink-wash line-through"
                        : step.status === "completed"
                        ? "text-muted-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {step.description || step.action || "Working…"}
                  </span>
                  {step.tool && (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground/70 font-mono shrink-0">
                      <Terminal className="w-3 h-3" strokeWidth={1.5} />
                      {step.tool}
                      {step.action ? `·${step.action}` : ""}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StepIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="w-[18px] h-[18px] text-ink-deep dark:text-ink-paper shrink-0" strokeWidth={1.75} />;
    case "running":
      return (
        <span className="inline-block w-[18px] h-[18px] rounded-full border-2 border-ink-dry border-t-ink-deep dark:border-t-ink-paper animate-spin shrink-0" />
      );
    case "awaiting_approval":
      return <PauseCircle className="w-[18px] h-[18px] text-ink-stone shrink-0" strokeWidth={1.75} />;
    case "failed":
      return <AlertCircle className="w-[18px] h-[18px] text-ink-wash shrink-0" strokeWidth={1.75} />;
    default:
      return <Circle className="w-[18px] h-[18px] text-muted-foreground/40 shrink-0" strokeWidth={1.75} />;
  }
}

/* ─── Approval card ──────────────────────────── */
function ApprovalCard({
  approval,
  onRespond,
}: {
  approval: ApprovalState;
  onRespond: (decision: "approved" | "rejected") => void;
}) {
  return (
    <div className="mb-6 pl-7">
      <div className="ink-wash rounded-xl border border-border/60 p-4 animate-ink-bleed">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-7 h-7 rounded-md ink-seal flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4 text-ink-paper" strokeWidth={1.5} />
          </div>
          <span className="text-[13px] font-semibold text-foreground">Approval required</span>
        </div>
        <p className="text-[13px] text-muted-foreground mb-3">
          <span className="font-mono text-ink-stone">{approval.tool}.{approval.action}</span>{" "}
          {approval.description}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onRespond("approved")}
            className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-foreground text-background text-[13px] font-medium hover:opacity-90 transition-opacity"
          >
            <Check className="w-3.5 h-3.5" strokeWidth={2} />
            Approve
          </button>
          <button
            onClick={() => onRespond("rejected")}
            className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg border border-border/60 text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            <X className="w-3.5 h-3.5" strokeWidth={2} />
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

