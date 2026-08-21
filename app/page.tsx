"use client";

import React, { useState, useCallback, useEffect } from "react";
import { SidebarNav, type ConversationItem, type SkillItem } from "@/components/ui/dashboard-sidebar";
import InkChat from "@/components/ui/ink-chat";
import SkillDetail from "@/components/ui/skill-detail";
import SkillsModal from "@/components/ui/skills-modal";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Bell,
  X,
  Command,
} from "lucide-react";

function titleFor(id: string, conversations: ConversationItem[], skills: SkillItem[]): string {
  if (id === "home") return "New chat";
  if (id === "search") return "Search";
  if (id === "api") return "API Keys";
  if (id === "webhooks") return "Webhooks";
  if (id === "settings") return "Settings";
  if (id === "logout") return "Log out";
  if (id.startsWith("conv:")) {
    return conversations.find((c) => c.id === id.slice(5))?.title ?? "Chat";
  }
  if (id.startsWith("skill:")) {
    return skills.find((s) => s.name === id.slice(6))?.title ?? "Skill";
  }
  return "Solomon";
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeId, setActiveId] = useState("home");
  const [activeWorkspace, setActiveWorkspace] = useState("Solomon");
  const [searchOpen, setSearchOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [chatKey, setChatKey] = useState(0);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);

  const refreshConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setConversations(
          json.data.map((c: { id: string; title: string }) => ({ id: c.id, title: c.title }))
        );
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/conversations")
      .then((res) => res.json())
      .then((json) => {
        if (cancelled || !json.success || !Array.isArray(json.data)) return;
        setConversations(
          json.data.map((c: { id: string; title: string }) => ({ id: c.id, title: c.title }))
        );
      })
      .catch(() => {
        /* ignore */
      });
    fetch("/api/skills")
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.success && Array.isArray(json.data)) setSkills(json.data);
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleNewChat = useCallback(() => {
    setActiveId("home");
    setChatKey((k) => k + 1);
  }, []);

  const handleSelect = (id: string) => {
    if (id === "search") {
      setSearchOpen(true);
      return;
    }
    if (id === "skills") {
      setSkillsOpen(true);
      return;
    }
    if (id === "home") {
      handleNewChat();
      return;
    }
    setActiveId(id);
  };

  const activeTitle = titleFor(activeId, conversations, skills);

  const isChat = activeId === "home" || activeId.startsWith("conv:");
  const isSkill = activeId.startsWith("skill:");

  return (
    <div className="flex h-screen overflow-hidden bg-background ink-texture">
      {/* ─── Sidebar ─────────────────────────────── */}
      <div
        className={`h-full transition-all duration-300 ease-in-out shrink-0 overflow-hidden ${
          sidebarOpen ? "w-[260px] opacity-100" : "w-0 opacity-0"
        }`}
      >
        <SidebarNav
          className="w-[260px] h-full"
          activeId={activeId}
          onSelect={handleSelect}
          activeWorkspace={activeWorkspace}
          onWorkspaceSelect={setActiveWorkspace}
          conversations={conversations}
        />
      </div>

      {/* ─── Main Content ────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ─── Top Bar ─────────────────────────── */}
        <header className="ink-header h-14 flex items-center px-4 justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-ink-deep/4 dark:hover:bg-ink-deep/6 hover:text-foreground transition-colors"
            >
              {sidebarOpen ? (
                <PanelLeftClose className="w-[18px] h-[18px]" strokeWidth={1.5} />
              ) : (
                <PanelLeftOpen className="w-[18px] h-[18px]" strokeWidth={1.5} />
              )}
            </button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="truncate">{activeWorkspace}</span>
              <span className="text-border">/</span>
              <span className="font-medium text-foreground truncate">{activeTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 h-8 w-56 px-3 rounded-md bg-muted/50 border border-border/50 text-[13px] text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              <Search className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Search...</span>
              <kbd className="ml-auto text-[10px] font-mono bg-background/60 border border-border/40 rounded px-1.5 py-0.5">
                ⌘K
              </kbd>
            </button>
            <button className="relative p-2 rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
              <Bell className="w-[18px] h-[18px]" strokeWidth={1.5} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-ink-deep dark:bg-ink-paper rounded-full ring-2 ring-card" />
            </button>
            <div className="ink-avatar w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold cursor-pointer">
              JD
            </div>
          </div>
        </header>

        {/* ─── Content Area ───────────────── */}
        {isChat ? (
          <InkChat
            key={activeId === "home" ? `home-${chatKey}` : activeId}
            conversationId={activeId === "home" ? null : activeId.slice(5)}
            onConversationCreated={refreshConversations}
            onNewChat={handleNewChat}
          />
        ) : isSkill ? (
          <SkillDetail name={activeId.slice(6)} />
        ) : (
          <main className="flex-1 overflow-y-auto scrollbar-hide p-6 md:p-8">
            <div className="max-w-2xl mx-auto mt-16 text-center">
              <h1 className="text-2xl font-semibold text-foreground tracking-tight ink-section-title">
                {activeTitle}
              </h1>
              <p className="text-sm text-muted-foreground mt-3">
                This section isn&apos;t built yet.
              </p>
            </div>
          </main>
        )}
      </div>

      {/* ─── Search Modal (⌘K) ───────────────── */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-background/40 backdrop-blur-sm px-4 animate-fade-in">
          <div className="absolute inset-0" onClick={() => setSearchOpen(false)} />
          <div className="relative w-full max-w-xl bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="flex items-center px-4 border-b border-border/50">
              <Search
                className="w-[18px] h-[18px] text-muted-foreground/70 mr-3 shrink-0"
                strokeWidth={1.5}
              />
              <input
                autoFocus
                className="flex-1 bg-transparent py-4 outline-none text-[14px] text-foreground placeholder:text-muted-foreground/50"
                placeholder="Search projects, docs, or actions..."
              />
              <kbd
                onClick={() => setSearchOpen(false)}
                className="hidden sm:inline-flex items-center justify-center h-5 px-1.5 ml-2 text-[10px] font-medium font-mono text-muted-foreground/70 bg-muted/50 border border-border/50 rounded cursor-pointer hover:text-foreground hover:bg-muted transition-colors"
              >
                ESC
              </kbd>
              <button
                onClick={() => setSearchOpen(false)}
                className="ml-3 p-1 rounded-md text-muted-foreground/70 hover:bg-muted/50 hover:text-foreground transition-colors"
              >
                <X className="w-[18px] h-[18px]" strokeWidth={1.5} />
              </button>
            </div>
            <div className="p-2 py-8 flex flex-col items-center justify-center">
              <Command
                className="w-6 h-6 text-muted-foreground/30 mb-2"
                strokeWidth={1.5}
              />
              <p className="text-[13px] text-muted-foreground font-medium">
                Type a command or search...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Skills Modal ─────────────────────── */}
      {skillsOpen && (
        <SkillsModal
          skills={skills}
          onClose={() => setSkillsOpen(false)}
          onSelect={(name) => {
            setActiveId(`skill:${name}`);
            setSkillsOpen(false);
          }}
        />
      )}
    </div>
  );
}
