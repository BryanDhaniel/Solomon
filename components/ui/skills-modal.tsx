"use client";

import React, { useState } from "react";
import { Search, Sparkles, X, ArrowUpRight } from "lucide-react";

export type SkillItem = {
  name: string;
  title: string;
  description: string;
};

export default function SkillsModal({
  skills,
  onClose,
  onSelect,
}: {
  skills: SkillItem[];
  onClose: () => void;
  onSelect: (name: string) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? skills.filter((s) =>
        `${s.title} ${s.description}`.toLowerCase().includes(query.toLowerCase())
      )
    : skills;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] bg-background/40 backdrop-blur-sm px-4 animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="flex items-center px-4 border-b border-border/50">
          <Search className="w-[18px] h-[18px] text-muted-foreground/70 mr-3 shrink-0" strokeWidth={1.5} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent py-4 outline-none text-[14px] text-foreground placeholder:text-muted-foreground/50"
            placeholder="Search skills..."
          />
          <kbd
            onClick={onClose}
            className="hidden sm:inline-flex items-center justify-center h-5 px-1.5 ml-2 text-[10px] font-medium font-mono text-muted-foreground/70 bg-muted/50 border border-border/50 rounded cursor-pointer hover:text-foreground hover:bg-muted transition-colors"
          >
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="ml-3 p-1 rounded-md text-muted-foreground/70 hover:bg-muted/50 hover:text-foreground transition-colors"
          >
            <X className="w-[18px] h-[18px]" strokeWidth={1.5} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2 flex flex-col gap-0.5">
          {filtered.length === 0 ? (
            <div className="py-10 flex flex-col items-center justify-center">
              <Sparkles className="w-6 h-6 text-muted-foreground/30 mb-2" strokeWidth={1.5} />
              <p className="text-[13px] text-muted-foreground font-medium">No skills match your search.</p>
            </div>
          ) : (
            filtered.map((s) => (
              <button
                key={s.name}
                onClick={() => onSelect(s.name)}
                className="group flex items-start gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-muted/30 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-foreground/[0.06] dark:bg-foreground/[0.08] flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-ink-stone" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-medium text-foreground">{s.title}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/0 group-hover:text-muted-foreground transition-all shrink-0" strokeWidth={1.5} />
                  </div>
                  <p className="text-[12px] text-muted-foreground leading-snug line-clamp-2 mt-0.5">
                    {s.description}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
