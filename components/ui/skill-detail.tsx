"use client";

import React, { useState, useEffect } from "react";
import { RenderMarkdown } from "@/components/ui/markdown";
import { Sparkles } from "lucide-react";

type SkillData = {
  name: string;
  title: string;
  description: string;
  body: string;
};

export default function SkillDetail({ name }: { name: string }) {
  const [skill, setSkill] = useState<SkillData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/skills/${name}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.success) setSkill(json.data);
        else setError(true);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [name]);

  if (error) {
    return (
      <main className="flex-1 overflow-y-auto scrollbar-hide p-8">
        <p className="text-sm text-muted-foreground">Skill not found.</p>
      </main>
    );
  }

  if (!skill) {
    return (
      <main className="flex-1 overflow-y-auto scrollbar-hide p-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="inline-block w-4 h-4 rounded-full border-2 border-ink-stone/30 border-t-ink-stone animate-spin" />
          <span className="text-[13px]">Loading…</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="max-w-[720px] mx-auto px-5 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-foreground text-background flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-foreground tracking-tight">{skill.title}</h1>
            <p className="text-[12px] font-mono text-muted-foreground">{skill.name}</p>
          </div>
        </div>

        {skill.description && (
          <p className="text-[15px] text-muted-foreground mb-6 leading-relaxed">{skill.description}</p>
        )}

        <div className="ink-card rounded-xl p-6">
          <div className="text-[15px] text-foreground/85 leading-[1.7]">
            <RenderMarkdown content={skill.body} />
          </div>
        </div>
      </div>
    </main>
  );
}
