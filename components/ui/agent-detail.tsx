"use client";

import React, { useState, useEffect } from "react";
import { RenderMarkdown } from "@/components/ui/markdown";
import {
  getAgent,
  listSkills,
  listTools,
  updateAgent,
  deleteAgent,
  type SkillInfo,
} from "@/lib/client/api";
import type { Agent, ToolDefinition } from "@/lib/shared/types";
import { Bot, Check, Save, Trash2 } from "lucide-react";

type AgentData = Agent;
type ToolInfo = ToolDefinition;

export default function AgentDetail({
  agentId,
  onDeleted,
}: {
  agentId: string;
  onDeleted?: () => void;
}) {
  const [agent, setAgent] = useState<AgentData | null>(null);
  const [skills, setSkills] = useState<SkillInfo[]>([]);
  const [tools, setTools] = useState<ToolInfo[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getAgent(agentId), listSkills(), listTools()])
      .then(([a, s, t]) => {
        if (cancelled) return;
        setAgent(a);
        setName(a.name);
        setDescription(a.description);
        setSelectedSkills(a.skills);
        setSelectedTools(a.tools);
        setSkills(s);
        setTools(t);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [agentId]);

  if (error) {
    return (
      <main className="flex-1 overflow-y-auto scrollbar-hide p-8">
        <p className="text-sm text-muted-foreground">Agent not found.</p>
      </main>
    );
  }

  if (!agent) {
    return (
      <main className="flex-1 overflow-y-auto scrollbar-hide p-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="inline-block w-4 h-4 rounded-full border-2 border-ink-stone/30 border-t-ink-stone animate-spin" />
          <span className="text-[13px]">Loading…</span>
        </div>
      </main>
    );
  }

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await updateAgent(agent.id, {
        name: name.trim() || agent.name,
        description,
        skills: selectedSkills,
        tools: selectedTools,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch {
      /* ignore */
    }
    setSaving(false);
  };

  const remove = async () => {
    if (!window.confirm(`Delete the agent "${agent.name}"?`)) return;
    try {
      await deleteAgent(agent.id);
      onDeleted?.();
    } catch {
      /* ignore */
    }
  };

  return (
    <main className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="max-w-[720px] mx-auto px-5 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-foreground text-background flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={agent.isDefault}
              title={agent.isDefault ? "The default agent's name is fixed" : undefined}
              className={`text-xl font-semibold text-foreground tracking-tight bg-transparent outline-none border-b border-transparent focus:border-ink-wash/50 ${
                agent.isDefault ? "" : "cursor-text"
              }`}
            />
          </div>
          <div className="flex items-center gap-2">
            {!agent.isDefault && (
              <button
                onClick={remove}
                className="p-2 rounded-md text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/30 transition-colors"
                title="Delete agent"
              >
                <Trash2 className="w-4 h-4" strokeWidth={1.5} />
              </button>
            )}
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-foreground text-background text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" strokeWidth={2} /> Saved
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" strokeWidth={1.5} /> Save
                </>
              )}
            </button>
          </div>
        </div>

        {agent.isDefault && (
          <p className="mb-4 text-[11px] font-mono uppercase tracking-wider text-muted-foreground/60">
            default agent · name and deletion are fixed
          </p>
        )}

        {/* Description */}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="What is this agent for?"
          className="w-full bg-card border border-border/60 rounded-xl px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground/40 outline-none resize-none focus:border-ink-stone/40 transition-colors mb-6"
        />

        {/* Skills */}
        <section className="mb-6">
          <h2 className="text-[11px] font-semibold tracking-wider text-muted-foreground/50 uppercase mb-2">
            Skills — how it works
          </h2>
          <div className="flex flex-col gap-1.5">
            {skills.length === 0 && (
              <p className="text-[13px] text-muted-foreground/60 px-1">No skills installed.</p>
            )}
            {skills.map((s) => {
              const on = selectedSkills.includes(s.name);
              return (
                <button
                  key={s.name}
                  onClick={() => setSelectedSkills(toggle(selectedSkills, s.name))}
                  className={`ink-card flex items-start gap-3 p-3 rounded-xl text-left transition-colors ${
                    on ? "border-ink-stone/40" : ""
                  }`}
                >
                  <span
                    className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      on ? "bg-foreground text-background border-foreground" : "border-border"
                    }`}
                  >
                    {on && <Check className="w-3 h-3" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-foreground">{s.title}</span>
                    {s.description && (
                      <span className="block text-[12px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">
                        {s.description}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Tools */}
        <section className="mb-6">
          <h2 className="text-[11px] font-semibold tracking-wider text-muted-foreground/50 uppercase mb-2">
            Tools — what it can do
          </h2>
          <div className="flex flex-col gap-1.5">
            {tools.map((t) => {
              const on = selectedTools.includes(t.name.toLowerCase());
              return (
                <button
                  key={t.name}
                  onClick={() => setSelectedTools(toggle(selectedTools, t.name.toLowerCase()))}
                  className={`ink-card flex items-start gap-3 p-3 rounded-xl text-left transition-colors ${
                    on ? "border-ink-stone/40" : ""
                  }`}
                >
                  <span
                    className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      on ? "bg-foreground text-background border-foreground" : "border-border"
                    }`}
                  >
                    {on && <Check className="w-3 h-3" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-foreground font-mono">{t.name}</span>
                    <span className="block text-[12px] text-muted-foreground leading-snug mt-0.5">
                      {t.description}
                    </span>
                    <span className="block text-[11px] text-muted-foreground/60 font-mono mt-1">
                      {t.actions.map((a) => a.action).join(" · ")}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <p className="text-[12px] text-muted-foreground/50 leading-relaxed">
          Changes apply to new messages in conversations running this agent.
        </p>
      </div>
    </main>
  );
}
