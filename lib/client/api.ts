import type {
  Agent,
  Conversation,
  Message,
  Project,
  ToolDefinition,
} from "@/lib/shared/types";

export type SkillInfo = { name: string; title: string; description: string };
export type SkillDetail = SkillInfo & { body: string };

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(message);
  }
}

type Envelope<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new ApiError("network_error", "Network request failed");
  }
  const json = (await res.json().catch(() => null)) as Envelope<T> | null;
  if (!json || !json.success) {
    const err = json && !json.success ? json.error : undefined;
    throw new ApiError(
      err?.code ?? "request_failed",
      err?.message ?? `Request failed with status ${res.status}`
    );
  }
  return json.data;
}

function init(method: string, body?: unknown): RequestInit | undefined {
  if (!body) return { method };
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

/* ─── Conversations ─────────────────────────── */

export function listConversations(): Promise<Conversation[]> {
  return request<Conversation[]>("/api/conversations");
}

export function getConversation(
  id: string
): Promise<{ conversation: Conversation; messages: Message[] }> {
  return request(`/api/conversations/${id}`);
}

export function createConversation(title?: string): Promise<Conversation> {
  return request("/api/conversations", init("POST", title ? { title } : {}));
}

export function updateConversation(
  id: string,
  fields: { pinned?: boolean; title?: string; projectId?: string | null }
): Promise<Conversation> {
  return request(`/api/conversations/${id}`, init("PATCH", fields));
}

export function deleteConversation(id: string): Promise<void> {
  return request(`/api/conversations/${id}`, { method: "DELETE" });
}

/* ─── Projects ──────────────────────────────── */

export function listProjects(): Promise<Project[]> {
  return request<Project[]>("/api/projects");
}

export function createProject(name: string): Promise<Project> {
  return request("/api/projects", init("POST", { name }));
}

export function deleteProject(id: string): Promise<void> {
  return request(`/api/projects/${id}`, { method: "DELETE" });
}

/* ─── Agents ────────────────────────────────── */

export function listAgents(): Promise<Agent[]> {
  return request<Agent[]>("/api/agents");
}

export function getAgent(id: string): Promise<Agent> {
  return request<Agent>(`/api/agents/${id}`);
}

export function createAgent(input: {
  name: string;
}): Promise<Agent> {
  return request("/api/agents", init("POST", input));
}

export function updateAgent(
  id: string,
  fields: Partial<Pick<Agent, "name" | "description" | "skills" | "tools">>
): Promise<Agent> {
  return request(`/api/agents/${id}`, init("PATCH", fields));
}

export function deleteAgent(id: string): Promise<void> {
  return request(`/api/agents/${id}`, { method: "DELETE" });
}

/* ─── Skills & Tools ────────────────────────── */

export function listSkills(): Promise<SkillInfo[]> {
  return request<SkillInfo[]>("/api/skills");
}

export function getSkill(name: string): Promise<SkillDetail> {
  return request<SkillDetail>(`/api/skills/${name}`);
}

export function listTools(): Promise<ToolDefinition[]> {
  return request<ToolDefinition[]>("/api/tools");
}

/* ─── Approvals ─────────────────────────────── */

export function resolveApproval(
  id: string,
  decision: "approved" | "rejected"
): Promise<{ id: string; status: string }> {
  return request(`/api/approvals/${id}`, init("POST", { decision }));
}
