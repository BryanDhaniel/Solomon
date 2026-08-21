"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MoreHorizontal,
  Pin,
  PinOff,
  Pencil,
  FolderKanban,
  Trash2,
} from "lucide-react";

export default function ChatHeader({
  title,
  pinned,
  projectName,
  onTogglePin,
  onRename,
  onAddToProject,
  onDelete,
}: {
  title: string;
  pinned: boolean;
  projectName?: string;
  onTogglePin: () => void;
  onRename: (title: string) => void;
  onAddToProject: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commitRename = () => {
    const next = draft.trim();
    if (next && next !== title) onRename(next);
    setEditing(false);
  };

  return (
    <header className="shrink-0 px-5 pt-4 pb-2 relative z-10">
      <div className="max-w-[720px] mx-auto flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-2">
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") setEditing(false);
              }}
              className="text-[15px] font-semibold text-foreground bg-transparent outline-none border-b border-ink-wash/50 focus:border-ink-deep dark:focus:border-ink-paper px-1 -mx-1 truncate"
            />
          ) : (
            <h1
              className="text-[15px] font-semibold text-foreground truncate cursor-pointer hover:text-ink-stone transition-colors"
              onClick={() => {
                setDraft(title);
                setEditing(true);
              }}
              title="Click to rename"
            >
              {title}
            </h1>
          )}
          {pinned && !editing && (
            <Pin className="w-3.5 h-3.5 text-ink-wash shrink-0" strokeWidth={1.5} />
          )}
        </div>

        {projectName && !editing && (
          <span className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground/70 font-mono shrink-0">
            <FolderKanban className="w-3 h-3" strokeWidth={1.5} />
            {projectName}
          </span>
        )}

        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            title="Chat actions"
          >
            <MoreHorizontal className="w-[18px] h-[18px]" strokeWidth={1.5} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-9 z-50 w-52 bg-card border border-border/60 rounded-xl shadow-xl py-1 overflow-hidden animate-scale-in">
                <button
                  onClick={() => {
                    onTogglePin();
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-foreground/90 hover:bg-muted/30 transition-colors text-left"
                >
                  {pinned ? (
                    <PinOff className="w-4 h-4 text-ink-wash" strokeWidth={1.5} />
                  ) : (
                    <Pin className="w-4 h-4 text-ink-wash" strokeWidth={1.5} />
                  )}
                  {pinned ? "Unpin" : "Pin"}
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setDraft(title);
                    setEditing(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-foreground/90 hover:bg-muted/30 transition-colors text-left"
                >
                  <Pencil className="w-4 h-4 text-ink-wash" strokeWidth={1.5} />
                  Rename
                </button>

                <button
                  onClick={() => {
                    onAddToProject();
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-foreground/90 hover:bg-muted/30 transition-colors text-left"
                >
                  <FolderKanban className="w-4 h-4 text-ink-wash" strokeWidth={1.5} />
                  Add to project
                </button>

                <div className="h-px bg-border/50 my-1 mx-2" />

                <button
                  onClick={() => {
                    onDelete();
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors text-left"
                >
                  <Trash2 className="w-4 h-4 text-ink-wash" strokeWidth={1.5} />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
