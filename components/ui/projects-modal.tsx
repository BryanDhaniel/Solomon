"use client";

import React, { useState } from "react";
import { Folder, Search, X, Plus, Check } from "lucide-react";

export type ProjectItem = {
  id: string;
  name: string;
};

export default function ProjectsModal({
  projects,
  mode,
  currentProjectId,
  onClose,
  onCreate,
  onPick,
}: {
  projects: ProjectItem[];
  mode: "browse" | "assign";
  currentProjectId?: string | null;
  onClose: () => void;
  onCreate: (name: string) => void;
  onPick: (project: ProjectItem | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");

  const filtered = query.trim()
    ? projects.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    : projects;

  const submitNew = () => {
    const name = newName.trim();
    if (!name) return;
    onCreate(name);
    setNewName("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[14vh] bg-background/40 backdrop-blur-sm px-4 animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="flex items-center px-4 border-b border-border/60">
          <Search
            className="w-[18px] h-[18px] text-muted-foreground/70 mr-3 shrink-0"
            strokeWidth={1.5}
          />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent py-4 outline-none text-[14px] text-foreground placeholder:text-muted-foreground/50"
            placeholder="Search projects..."
          />
          <button
            onClick={onClose}
            className="ml-3 p-1 rounded-md text-muted-foreground/70 hover:bg-muted/50 hover:text-foreground transition-colors"
          >
            <X className="w-[18px] h-[18px]" strokeWidth={1.5} />
          </button>
        </div>

        <div className="max-h-[46vh] overflow-y-auto p-2 flex flex-col gap-0.5">
          {mode === "assign" && (
            <button
              onClick={() => onPick(null)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-muted/30 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-foreground/[0.05] dark:bg-foreground/[0.07] flex items-center justify-center shrink-0">
                <Folder className="w-4 h-4 text-ink-stone" strokeWidth={1.5} />
              </div>
              <span className="flex-1 text-[13px] text-foreground">No project</span>
              {!currentProjectId && <Check className="w-4 h-4 text-ink-deep dark:text-ink-paper" strokeWidth={2} />}
            </button>
          )}

          {filtered.length === 0 && !(mode === "assign" && !query.trim()) ? (
            <div className="py-8 flex flex-col items-center justify-center">
              <Folder className="w-6 h-6 text-muted-foreground/30 mb-2" strokeWidth={1.5} />
              <p className="text-[13px] text-muted-foreground font-medium">No projects found.</p>
            </div>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => onPick(p)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-muted/30 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-foreground/[0.05] dark:bg-foreground/[0.07] flex items-center justify-center shrink-0">
                  <Folder className="w-4 h-4 text-ink-stone" strokeWidth={1.5} />
                </div>
                <span className="flex-1 text-[13px] text-foreground truncate">{p.name}</span>
                {mode === "assign" && currentProjectId === p.id && (
                  <Check className="w-4 h-4 text-ink-deep dark:text-ink-paper" strokeWidth={2} />
                )}
              </button>
            ))
          )}
        </div>

        <div className="border-t border-border/60 p-2 flex items-center gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitNew();
              }
            }}
            className="flex-1 bg-transparent px-3 py-2 outline-none text-[13px] text-foreground placeholder:text-muted-foreground/50"
            placeholder="New project name..."
          />
          <button
            onClick={submitNew}
            disabled={!newName.trim()}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-foreground text-background text-[13px] font-medium hover:opacity-90 transition-opacity disabled:bg-muted/60 disabled:text-muted-foreground/40 disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
