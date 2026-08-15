"use client";

import React, { useState } from "react";
import { SidebarNav } from "@/components/ui/dashboard-sidebar";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Bell,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Activity,
  ArrowUpRight,
  MoreHorizontal,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  X,
  Command,
} from "lucide-react";

/* ─── Stat Card Data ─────────────────────────── */
const stats = [
  {
    title: "Total Revenue",
    value: "$45,231.89",
    change: "+20.1%",
    trend: "up" as const,
    icon: DollarSign,
    description: "from last month",
  },
  {
    title: "Active Users",
    value: "2,350",
    change: "+12.5%",
    trend: "up" as const,
    icon: Users,
    description: "from last month",
  },
  {
    title: "Conversion Rate",
    value: "3.24%",
    change: "-0.4%",
    trend: "down" as const,
    icon: Activity,
    description: "from last month",
  },
  {
    title: "Avg. Session",
    value: "4m 32s",
    change: "+8.2%",
    trend: "up" as const,
    icon: Clock,
    description: "from last month",
  },
];

/* ─── Recent Activity ────────────────────────── */
const recentActivity = [
  {
    id: 1,
    user: "Sarah Chen",
    initials: "SC",
    action: "pushed 3 commits to",
    target: "main",
    time: "2 min ago",
    color: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  },
  {
    id: 2,
    user: "Alex Rivera",
    initials: "AR",
    action: "opened a pull request in",
    target: "frontend-v2",
    time: "15 min ago",
    color: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  },
  {
    id: 3,
    user: "Jordan Park",
    initials: "JP",
    action: "commented on issue",
    target: "#142",
    time: "1 hour ago",
    color: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  {
    id: 4,
    user: "Maya Patel",
    initials: "MP",
    action: "deployed to",
    target: "production",
    time: "3 hours ago",
    color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  {
    id: 5,
    user: "Liam Nguyen",
    initials: "LN",
    action: "merged branch",
    target: "feature/auth",
    time: "5 hours ago",
    color: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  },
];

/* ─── Projects ───────────────────────────────── */
const projects = [
  {
    name: "Website Redesign",
    status: "In Progress",
    statusIcon: Circle,
    statusColor: "text-blue-500",
    progress: 65,
    progressColor: "bg-blue-500",
    members: 4,
    dueDate: "Aug 28",
  },
  {
    name: "Mobile App v2",
    status: "On Track",
    statusIcon: CheckCircle2,
    statusColor: "text-emerald-500",
    progress: 82,
    progressColor: "bg-emerald-500",
    members: 6,
    dueDate: "Sep 12",
  },
  {
    name: "API Migration",
    status: "At Risk",
    statusIcon: AlertCircle,
    statusColor: "text-amber-500",
    progress: 34,
    progressColor: "bg-amber-500",
    members: 3,
    dueDate: "Aug 20",
  },
  {
    name: "Analytics Dashboard",
    status: "In Progress",
    statusIcon: Circle,
    statusColor: "text-blue-500",
    progress: 48,
    progressColor: "bg-blue-500",
    members: 2,
    dueDate: "Sep 5",
  },
];

/* ─── Mini bar chart data ────────────────────── */
const chartData = [35, 58, 42, 68, 55, 78, 62, 85, 72, 90, 68, 95];
const chartLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/* ─── Upcoming Events ────────────────────────── */
const upcomingEvents = [
  {
    title: "Sprint Planning",
    time: "10:00 AM",
    date: "Today",
    dotColor: "bg-blue-500",
  },
  {
    title: "Design Review",
    time: "2:00 PM",
    date: "Today",
    dotColor: "bg-violet-500",
  },
  {
    title: "Team Standup",
    time: "9:30 AM",
    date: "Tomorrow",
    dotColor: "bg-emerald-500",
  },
  {
    title: "Client Demo",
    time: "4:00 PM",
    date: "Aug 18",
    dotColor: "bg-amber-500",
  },
];

/* ═══════════════════════════════════════════════ */

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeId, setActiveId] = useState("home");
  const [activeWorkspace, setActiveWorkspace] = useState("Solomon");
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSelect = (id: string) => {
    if (id === "search") {
      setSearchOpen(true);
      return;
    }
    setActiveId(id);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ─── Sidebar ─────────────────────────────── */}
      <div
        className={`h-full transition-all duration-300 ease-in-out shrink-0 overflow-hidden ${
          sidebarOpen
            ? "w-[260px] opacity-100"
            : "w-0 opacity-0"
        }`}
      >
        <SidebarNav
          className="w-[260px] h-full"
          activeId={activeId}
          onSelect={handleSelect}
          activeWorkspace={activeWorkspace}
          onWorkspaceSelect={setActiveWorkspace}
        />
      </div>

      {/* ─── Main Content ────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ─── Top Bar ─────────────────────────── */}
        <header className="h-14 border-b border-border/50 flex items-center px-4 justify-between bg-card/80 backdrop-blur-sm shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground transition-colors"
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
              <span className="font-medium text-foreground truncate">
                Dashboard
              </span>
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
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-card" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm cursor-pointer">
              JD
            </div>
          </div>
        </header>

        {/* ─── Dashboard Content ─────────────── */}
        <main className="flex-1 overflow-y-auto scrollbar-hide p-6 md:p-8">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Welcome back, John. Here&apos;s what&apos;s happening.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 h-9 px-4 rounded-lg border border-border/50 text-sm text-foreground hover:bg-muted/50 transition-colors">
                <Calendar className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                Aug 2026
              </button>
              <button className="flex items-center gap-2 h-9 px-4 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity">
                Download Report
              </button>
            </div>
          </div>

          {/* ─── Stat Cards ──────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, i) => (
              <div
                key={stat.title}
                className="group bg-card rounded-xl border border-border/50 p-5 hover:shadow-md hover:border-border transition-all duration-200 animate-slide-up"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px] font-medium text-muted-foreground">
                    {stat.title}
                  </span>
                  <stat.icon
                    className="w-4 h-4 text-muted-foreground/50"
                    strokeWidth={1.5}
                  />
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-2xl font-semibold text-foreground tracking-tight">
                      {stat.value}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className={`flex items-center gap-0.5 text-xs font-medium ${
                          stat.trend === "up"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-500 dark:text-red-400"
                        }`}
                      >
                        {stat.trend === "up" ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {stat.change}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {stat.description}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ─── Charts + Events Row ─────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            {/* Revenue Chart */}
            <div className="lg:col-span-2 bg-card rounded-xl border border-border/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Revenue Overview
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Monthly revenue for 2026
                  </p>
                </div>
                <button className="p-1.5 rounded-md text-muted-foreground hover:bg-muted/50 transition-colors">
                  <MoreHorizontal className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
              {/* Simple bar chart */}
              <div className="flex items-end gap-[6px] h-44">
                {chartData.map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <div
                      className="w-full rounded-t-[4px] bg-foreground/10 hover:bg-foreground/20 transition-colors relative group/bar cursor-pointer"
                      style={{ height: `${val}%` }}
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-t-[4px] bg-foreground/80 transition-all duration-500"
                        style={{ height: `${val}%` }}
                      />
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover/bar:block bg-foreground text-background text-[10px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap">
                        ${Math.round(val * 520)}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground/60 font-medium">
                      {chartLabels[i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-card rounded-xl border border-border/50 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-foreground">
                  Upcoming
                </h2>
                <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  View all
                </button>
              </div>
              <div className="flex flex-col gap-1">
                {upcomingEvents.map((event, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer group/event"
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${event.dotColor}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate group-hover/event:text-foreground">
                        {event.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {event.date} · {event.time}
                      </p>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/0 group-hover/event:text-muted-foreground transition-all shrink-0 mt-0.5" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Projects + Activity Row ─────── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Active Projects */}
            <div className="lg:col-span-3 bg-card rounded-xl border border-border/50 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-foreground">
                  Active Projects
                </h2>
                <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  View all →
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {projects.map((project) => (
                  <div
                    key={project.name}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer group/proj"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className="text-[13px] font-medium text-foreground truncate">
                          {project.name}
                        </p>
                        <span
                          className={`flex items-center gap-1 text-[11px] font-medium ${project.statusColor}`}
                        >
                          <project.statusIcon className="w-3 h-3" />
                          {project.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${project.progressColor} transition-all duration-700`}
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-muted-foreground font-medium tabular-nums">
                          {project.progress}%
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex -space-x-1.5 mb-1 justify-end">
                        {Array.from({ length: Math.min(project.members, 3) }).map(
                          (_, j) => (
                            <div
                              key={j}
                              className="w-6 h-6 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[9px] font-semibold text-muted-foreground"
                            >
                              {String.fromCharCode(65 + j)}
                            </div>
                          )
                        )}
                        {project.members > 3 && (
                          <div className="w-6 h-6 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[9px] font-medium text-muted-foreground">
                            +{project.members - 3}
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Due {project.dueDate}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-card rounded-xl border border-border/50 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-foreground">
                  Recent Activity
                </h2>
                <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  View all
                </button>
              </div>
              <div className="flex flex-col gap-1">
                {recentActivity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 ${item.color}`}
                    >
                      {item.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-foreground leading-snug">
                        <span className="font-medium">{item.user}</span>{" "}
                        <span className="text-muted-foreground">
                          {item.action}
                        </span>{" "}
                        <span className="font-medium">{item.target}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {item.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
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
    </div>
  );
}
