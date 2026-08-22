"use client";

import React, { useState, useCallback, useEffect } from "react";
import { SidebarNav, type ConversationItem, type SkillItem } from "@/components/ui/dashboard-sidebar";
import InkChat from "@/components/ui/ink-chat";
import SkillDetail from "@/components/ui/skill-detail";
import SkillsModal from "@/components/ui/skills-modal";
import ProjectsModal, { type ProjectItem } from "@/components/ui/projects-modal";
import AgentsModal, { type AgentItem } from "@/components/ui/agents-modal";
import AgentDetail from "@/components/ui/agent-detail";
import ChatHeader from "@/components/ui/chat-header";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import {
  listConversations,
  listProjects,
  listAgents,
  listSkills,
  updateConversation,
  createProject as apiCreateProject,
  createAgent as apiCreateAgent,
  deleteConversation as apiDeleteConversation,
  deleteProject as apiDeleteProject,
} from "@/lib/client/api";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Bell,
  X,
  Command,
  FolderKanban,
  MessageSquare,
  Trash2,
} from "lucide-react";

function titleFor(
  id: string,
  conversations: ConversationItem[],
  skills: SkillItem[],
  projects: ProjectItem[],
  agents: AgentItem[]
): string {
  if (id === "home") return "New chat";
  if (id === "search") return "Search";
  if (id === "projects") return "Projects";
  if (id === "agents") return "Agents";
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
  if (id.startsWith("project:")) {
    return projects.find((p) => p.id === id.slice(8))?.name ?? "Project";
  }
  if (id.startsWith("agent:")) {
    return agents.find((a) => a.id === id.slice(6))?.name ?? "Agent";
  }
  return "Solomon";
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeId, setActiveId] = useState("home");
  const [activeWorkspace, setActiveWorkspace] = useState("Solomon");
  const [searchOpen, setSearchOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [agentsOpen, setAgentsOpen] = useState(false);
  const [assignProjectFor, setAssignProjectFor] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteProjectTarget, setDeleteProjectTarget] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState(0);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [agents, setAgents] = useState<AgentItem[]>([]);

  const refreshConversations = useCallback(async () => {
    try {
      setConversations(await listConversations());
    } catch {
      /* ignore */
    }
  }, []);

  const refreshProjects = useCallback(async () => {
    try {
      setProjects(await listProjects());
    } catch {
      /* ignore */
    }
  }, []);

  const refreshAgents = useCallback(async () => {
    try {
      setAgents(await listAgents());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    listConversations()
      .then((items) => {
        if (items) setConversations(items);
      })
      .catch(() => {
        /* ignore */
      });
    listProjects()
      .then((items) => {
        if (items) setProjects(items);
      })
      .catch(() => {
        /* ignore */
      });
    listAgents()
      .then((items) => {
        if (items) setAgents(items);
      })
      .catch(() => {
        /* ignore */
      });
    listSkills()
      .then((items) => setSkills(items))
      .catch(() => {
        /* ignore */
      });
  }, []);

  const handleNewChat = useCallback(() => {
    setActiveId("home");
    setCurrentConversationId(null);
    setChatKey((k) => k + 1);
  }, []);

  const handleConversationCreated = useCallback(
    (id: string) => {
      setCurrentConversationId(id);
      refreshConversations();
    },
    [refreshConversations]
  );

  const togglePin = useCallback(
    async (id: string, pinned: boolean) => {
      try {
        await updateConversation(id, { pinned });
      } catch {
        /* ignore */
      }
      refreshConversations();
    },
    [refreshConversations]
  );

  const renameConversation = useCallback(
    async (id: string, title: string) => {
      try {
        await updateConversation(id, { title });
      } catch {
        /* ignore */
      }
      refreshConversations();
    },
    [refreshConversations]
  );

  const assignConversationProject = useCallback(
    async (id: string, projectId: string | null) => {
      try {
        await updateConversation(id, { projectId });
      } catch {
        /* ignore */
      }
      refreshConversations();
    },
    [refreshConversations]
  );

  const createProject = useCallback(
    async (name: string) => {
      try {
        await apiCreateProject(name);
      } catch {
        /* ignore */
      }
      refreshProjects();
    },
    [refreshProjects]
  );

  const createAgent = useCallback(
    async (name: string) => {
      try {
        const agent = await apiCreateAgent({ name });
        setAgentsOpen(false);
        setCurrentConversationId(null);
        setActiveId(`agent:${agent.id}`);
      } catch {
        /* ignore */
      }
      refreshAgents();
    },
    [refreshAgents]
  );

  const confirmDeleteConversation = useCallback(async () => {
    const id = deleteTarget;
    if (!id) return;
    setDeleteTarget(null);
    try {
      await apiDeleteConversation(id);
    } catch {
      /* ignore */
    }
    if (activeId === `conv:${id}` || currentConversationId === id) {
      handleNewChat();
    }
    refreshConversations();
  }, [deleteTarget, activeId, currentConversationId, handleNewChat, refreshConversations]);

  const confirmDeleteProject = useCallback(async () => {
    const id = deleteProjectTarget;
    if (!id) return;
    setDeleteProjectTarget(null);
    try {
      await apiDeleteProject(id);
    } catch {
      /* ignore */
    }
    if (activeId === `project:${id}`) handleNewChat();
    refreshProjects();
    refreshConversations();
  }, [deleteProjectTarget, activeId, handleNewChat, refreshProjects, refreshConversations]);

  const handleSelect = (id: string) => {
    if (id === "search") {
      setSearchOpen(true);
      return;
    }
    if (id === "skills") {
      setSkillsOpen(true);
      return;
    }
    if (id === "projects") {
      setProjectsOpen(true);
      return;
    }
    if (id === "agents") {
      setAgentsOpen(true);
      return;
    }
    if (id === "home") {
      handleNewChat();
      return;
    }
    if (id.startsWith("conv:")) {
      setCurrentConversationId(id.slice(5));
    }
    setActiveId(id);
  };

  const activeTitle = titleFor(activeId, conversations, skills, projects, agents);

  const isChat = activeId === "home" || activeId.startsWith("conv:");
  const isSkill = activeId.startsWith("skill:");
  const isProject = activeId.startsWith("project:");
  const isAgent = activeId.startsWith("agent:");

  const currentConversation = currentConversationId
    ? conversations.find((c) => c.id === currentConversationId)
    : undefined;
  const currentProjectName = currentConversation?.projectId
    ? projects.find((p) => p.id === currentConversation.projectId)?.name
    : undefined;

  const activeProject = isProject
    ? projects.find((p) => p.id === activeId.slice(8))
    : undefined;

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
          onTogglePin={togglePin}
          onRenameConversation={renameConversation}
          onAddToProject={(id) => setAssignProjectFor(id)}
          onDeleteConversation={(id) => setDeleteTarget(id)}
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
              BD
            </div>
          </div>
        </header>

        {/* ─── Content Area ───────────────── */}
        {isChat ? (
          <>
            {currentConversation && (
              <ChatHeader
                title={currentConversation.title}
                pinned={currentConversation.pinned}
                projectName={currentProjectName}
                agentName={
                  currentConversation.agentId
                    ? agents.find((a) => a.id === currentConversation.agentId)?.name
                    : undefined
                }
                onTogglePin={() => togglePin(currentConversation.id, !currentConversation.pinned)}
                onRename={(title) => renameConversation(currentConversation.id, title)}
                onAddToProject={() => setAssignProjectFor(currentConversation.id)}
                onDelete={() => setDeleteTarget(currentConversation.id)}
              />
            )}
            <InkChat
              key={activeId === "home" ? `home-${chatKey}` : activeId}
              conversationId={activeId === "home" ? null : activeId.slice(5)}
              onConversationCreated={handleConversationCreated}
              onNewChat={handleNewChat}
            />
          </>
        ) : isSkill ? (
          <SkillDetail name={activeId.slice(6)} />
        ) : isAgent ? (
          <AgentDetail
            agentId={activeId.slice(6)}
            onDeleted={() => {
              handleNewChat();
              refreshAgents();
            }}
          />
        ) : isProject && activeProject ? (
          <main className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="max-w-[720px] mx-auto px-5 py-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-foreground/[0.06] dark:bg-foreground/[0.08] flex items-center justify-center">
                    <FolderKanban className="w-4 h-4 text-ink-stone" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-foreground tracking-tight">
                      {activeProject.name}
                    </h1>
                    <p className="text-[12px] text-muted-foreground">
                      {conversations.filter((c) => c.projectId === activeProject.id).length} chat
                      {conversations.filter((c) => c.projectId === activeProject.id).length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteProjectTarget(activeProject.id)}
                  className="p-2 rounded-md text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/30 transition-colors"
                  title="Delete project"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>

              {conversations.filter((c) => c.projectId === activeProject.id).length === 0 ? (
                <div className="ink-card rounded-xl p-8 text-center">
                  <p className="text-[13px] text-muted-foreground">No chats in this project yet.</p>
                  <p className="text-[12px] text-muted-foreground/60 mt-1">
                    Use a chat&apos;s menu to add it to this project.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {conversations
                    .filter((c) => c.projectId === activeProject.id)
                    .map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleSelect(`conv:${c.id}`)}
                        className="ink-card group flex items-center gap-3 p-3 rounded-xl text-left"
                      >
                        <MessageSquare className="w-4 h-4 text-ink-stone shrink-0" strokeWidth={1.5} />
                        <span className="flex-1 text-[13px] text-foreground truncate">{c.title}</span>
                        {c.pinned && <PinIcon />}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </main>
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
              <Search className="w-[18px] h-[18px] text-muted-foreground/70 mr-3 shrink-0" strokeWidth={1.5} />
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
              <Command className="w-6 h-6 text-muted-foreground/30 mb-2" strokeWidth={1.5} />
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

      {/* ─── Projects Modal (browse) ─────────── */}
      {projectsOpen && (
        <ProjectsModal
          projects={projects}
          mode="browse"
          onClose={() => setProjectsOpen(false)}
          onCreate={createProject}
          onPick={(p) => {
            if (p) {
              setCurrentConversationId(null);
              setActiveId(`project:${p.id}`);
            }
            setProjectsOpen(false);
          }}
        />
      )}

      {/* ─── Projects Modal (assign) ─────────── */}
      {assignProjectFor && (
        <ProjectsModal
          projects={projects}
          mode="assign"
          currentProjectId={conversations.find((c) => c.id === assignProjectFor)?.projectId ?? null}
          onClose={() => setAssignProjectFor(null)}
          onCreate={createProject}
          onPick={(p) => {
            assignConversationProject(assignProjectFor, p ? p.id : null);
            setAssignProjectFor(null);
          }}
        />
      )}

      {/* ─── Agents Modal ─────────────────────── */}
      {agentsOpen && (
        <AgentsModal
          agents={agents}
          onClose={() => setAgentsOpen(false)}
          onCreate={createAgent}
          onOpen={(agentId) => {
            setCurrentConversationId(null);
            setActiveId(`agent:${agentId}`);
            setAgentsOpen(false);
          }}
        />
      )}

      {/* ─── Delete confirmation ─────────────── */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete chat?"
          message="This will permanently delete the conversation and its messages. This cannot be undone."
          confirmLabel="Delete"
          onConfirm={confirmDeleteConversation}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {deleteProjectTarget && (
        <ConfirmDialog
          title="Delete project?"
          message="The project will be removed. Chats inside it are kept but moved out of the project."
          confirmLabel="Delete"
          onConfirm={confirmDeleteProject}
          onCancel={() => setDeleteProjectTarget(null)}
        />
      )}
    </div>
  );
}

function PinIcon() {
  return (
    <span className="inline-block w-3 h-3 shrink-0 rounded-full bg-ink-deep/70 dark:bg-ink-paper/70" />
  );
}
