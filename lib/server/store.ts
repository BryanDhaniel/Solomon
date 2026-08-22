import { getDb } from "./db";
import type {
  Agent,
  Approval,
  ApprovalStatus,
  Conversation,
  Execution,
  ExecutionStatus,
  ExecutionStep,
  Message,
  Project,
  Role,
} from "@/lib/shared/types";

type ConversationRow = {
  id: string;
  title: string;
  pinned: number;
  project_id: string | null;
  agent_id: string | null;
  created_at: string;
  updated_at: string;
};

type ProjectRow = {
  id: string;
  name: string;
  created_at: string;
};

type AgentRow = {
  id: string;
  name: string;
  description: string;
  skill_names: string;
  tool_names: string;
  is_default: number;
  created_at: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  role: Role;
  content: string;
  created_at: string;
};

type ExecutionRow = {
  id: string;
  conversation_id: string;
  status: ExecutionStatus;
  created_at: string;
  completed_at: string | null;
  result: string | null;
  error: string | null;
};

type StepRow = {
  id: string;
  execution_id: string;
  idx: number;
  type: ExecutionStep["type"];
  description: string;
  status: ExecutionStep["status"];
  tool: string | null;
  action: string | null;
  parameters: string | null;
  result: string | null;
  error: string | null;
  started_at: string | null;
  completed_at: string | null;
};

type ApprovalRow = {
  id: string;
  execution_id: string;
  step_id: string;
  tool: string;
  action: string;
  parameters: string;
  description: string;
  status: ApprovalStatus;
  created_at: string;
  resolved_at: string | null;
};

function mapConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    title: row.title,
    pinned: !!row.pinned,
    projectId: row.project_id,
    agentId: row.agent_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProject(row: ProjectRow): Project {
  return { id: row.id, name: row.name, createdAt: row.created_at };
}

function mapAgent(row: AgentRow): Agent {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    skills: JSON.parse(row.skill_names),
    tools: JSON.parse(row.tool_names),
    isDefault: !!row.is_default,
    createdAt: row.created_at,
  };
}

function mapMessage(row: MessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  };
}

function mapExecution(row: ExecutionRow): Execution {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    status: row.status,
    createdAt: row.created_at,
    completedAt: row.completed_at ?? undefined,
    result: row.result ?? undefined,
    error: row.error ?? undefined,
  };
}

function mapStep(row: StepRow): ExecutionStep {
  return {
    id: row.id,
    executionId: row.execution_id,
    index: row.idx,
    type: row.type,
    description: row.description,
    status: row.status,
    tool: row.tool ?? undefined,
    action: row.action ?? undefined,
    parameters: row.parameters ? JSON.parse(row.parameters) : undefined,
    result: row.result ? JSON.parse(row.result) : undefined,
    error: row.error ?? undefined,
    startedAt: row.started_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
  };
}

function mapApproval(row: ApprovalRow): Approval {
  return {
    id: row.id,
    executionId: row.execution_id,
    stepId: row.step_id,
    tool: row.tool,
    action: row.action,
    parameters: JSON.parse(row.parameters),
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at ?? undefined,
  };
}

export const store = {
  /* ─── Conversations ─────────────────────── */
  createConversation(id: string, title: string, now: string, agentId?: string | null): Conversation {
    getDb()
      .prepare(
        "INSERT INTO conversations (id, title, pinned, project_id, agent_id, created_at, updated_at) VALUES (?, ?, 0, NULL, ?, ?, ?)"
      )
      .run(id, title, agentId ?? null, now, now);
    return {
      id,
      title,
      pinned: false,
      projectId: null,
      agentId: agentId ?? null,
      createdAt: now,
      updatedAt: now,
    };
  },

  listConversations(): Conversation[] {
    const rows = getDb()
      .prepare("SELECT * FROM conversations ORDER BY pinned DESC, updated_at DESC")
      .all() as ConversationRow[];
    return rows.map(mapConversation);
  },

  getConversation(id: string): Conversation | undefined {
    const row = getDb().prepare("SELECT * FROM conversations WHERE id = ?").get(id) as
      | ConversationRow
      | undefined;
    return row ? mapConversation(row) : undefined;
  },

  touchConversation(id: string, now: string): void {
    getDb().prepare("UPDATE conversations SET updated_at = ? WHERE id = ?").run(now, id);
  },

  setPinned(id: string, pinned: boolean): void {
    getDb()
      .prepare("UPDATE conversations SET pinned = ? WHERE id = ?")
      .run(pinned ? 1 : 0, id);
  },

  setTitle(id: string, title: string): void {
    getDb().prepare("UPDATE conversations SET title = ? WHERE id = ?").run(title, id);
  },

  setProject(id: string, projectId: string | null): void {
    getDb()
      .prepare("UPDATE conversations SET project_id = ? WHERE id = ?")
      .run(projectId, id);
  },

  deleteConversation(id: string): void {
    const db = getDb();
    db.prepare("DELETE FROM messages WHERE conversation_id = ?").run(id);
    db.prepare("DELETE FROM executions WHERE conversation_id = ?").run(id);
    db.prepare("DELETE FROM conversations WHERE id = ?").run(id);
  },

  /* ─── Projects ───────────────────────────── */
  createProject(id: string, name: string, now: string): Project {
    getDb()
      .prepare("INSERT INTO projects (id, name, created_at) VALUES (?, ?, ?)")
      .run(id, name, now);
    return { id, name, createdAt: now };
  },

  listProjects(): Project[] {
    const rows = getDb()
      .prepare("SELECT * FROM projects ORDER BY created_at ASC")
      .all() as ProjectRow[];
    return rows.map(mapProject);
  },

  getProject(id: string): Project | undefined {
    const row = getDb().prepare("SELECT * FROM projects WHERE id = ?").get(id) as
      | ProjectRow
      | undefined;
    return row ? mapProject(row) : undefined;
  },

  deleteProject(id: string): void {
    const db = getDb();
    db.prepare("UPDATE conversations SET project_id = NULL WHERE project_id = ?").run(id);
    db.prepare("DELETE FROM projects WHERE id = ?").run(id);
  },

  /* ─── Agents ─────────────────────────────── */
  createAgent(agent: Agent): Agent {
    getDb()
      .prepare(
        `INSERT INTO agents (id, name, description, skill_names, tool_names, is_default, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        agent.id,
        agent.name,
        agent.description,
        JSON.stringify(agent.skills),
        JSON.stringify(agent.tools),
        agent.isDefault ? 1 : 0,
        agent.createdAt
      );
    return agent;
  },

  listAgents(): Agent[] {
    const rows = getDb()
      .prepare("SELECT * FROM agents ORDER BY is_default DESC, created_at ASC")
      .all() as AgentRow[];
    return rows.map(mapAgent);
  },

  getAgent(id: string): Agent | undefined {
    const row = getDb().prepare("SELECT * FROM agents WHERE id = ?").get(id) as
      | AgentRow
      | undefined;
    return row ? mapAgent(row) : undefined;
  },

  getDefaultAgent(): Agent | undefined {
    const row = getDb().prepare("SELECT * FROM agents WHERE is_default = 1").get() as
      | AgentRow
      | undefined;
    return row ? mapAgent(row) : undefined;
  },

  updateAgent(id: string, fields: Partial<Pick<Agent, "name" | "description" | "skills" | "tools">>): Agent | undefined {
    const existing = store.getAgent(id);
    if (!existing) return undefined;
    const next = { ...existing, ...fields };
    getDb()
      .prepare("UPDATE agents SET name = ?, description = ?, skill_names = ?, tool_names = ? WHERE id = ?")
      .run(next.name, next.description, JSON.stringify(next.skills), JSON.stringify(next.tools), id);
    return next;
  },

  deleteAgent(id: string): boolean {
    const existing = store.getAgent(id);
    if (!existing || existing.isDefault) return false;
    getDb().prepare("UPDATE conversations SET agent_id = NULL WHERE agent_id = ?").run(id);
    getDb().prepare("DELETE FROM agents WHERE id = ?").run(id);
    return true;
  },

  /* ─── Messages ──────────────────────────── */
  addMessage(
    id: string,
    conversationId: string,
    role: Role,
    content: string,
    createdAt: string
  ): Message {
    getDb()
      .prepare("INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)")
      .run(id, conversationId, role, content, createdAt);
    return { id, conversationId, role, content, createdAt };
  },

  listMessages(conversationId: string): Message[] {
    const rows = getDb()
      .prepare("SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC")
      .all(conversationId) as MessageRow[];
    return rows.map(mapMessage);
  },

  /* ─── Executions ────────────────────────── */
  createExecution(id: string, conversationId: string, now: string): Execution {
    getDb()
      .prepare("INSERT INTO executions (id, conversation_id, status, created_at) VALUES (?, ?, 'running', ?)")
      .run(id, conversationId, now);
    return { id, conversationId, status: "running", createdAt: now };
  },

  getExecution(id: string): Execution | undefined {
    const row = getDb().prepare("SELECT * FROM executions WHERE id = ?").get(id) as
      | ExecutionRow
      | undefined;
    return row ? mapExecution(row) : undefined;
  },

  listExecutions(conversationId: string): Execution[] {
    const rows = getDb()
      .prepare("SELECT * FROM executions WHERE conversation_id = ? ORDER BY created_at DESC")
      .all(conversationId) as ExecutionRow[];
    return rows.map(mapExecution);
  },

  updateExecutionStatus(
    id: string,
    status: ExecutionStatus,
    fields: { completedAt?: string; result?: string; error?: string } = {}
  ): void {
    const db = getDb();
    if (status === "completed" || status === "failed") {
      db.prepare(
        "UPDATE executions SET status = ?, completed_at = ?, result = ?, error = ? WHERE id = ?"
      ).run(status, fields.completedAt ?? null, fields.result ?? null, fields.error ?? null, id);
    } else {
      db.prepare("UPDATE executions SET status = ? WHERE id = ?").run(status, id);
    }
  },

  /* ─── Steps ─────────────────────────────── */
  upsertStep(step: ExecutionStep): void {
    getDb()
      .prepare(
        `INSERT INTO execution_steps
          (id, execution_id, idx, type, description, status, tool, action, parameters, result, error, started_at, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           status = excluded.status,
           result = excluded.result,
           error = excluded.error,
           started_at = excluded.started_at,
           completed_at = excluded.completed_at`
      )
      .run(
        step.id,
        step.executionId,
        step.index,
        step.type,
        step.description,
        step.status,
        step.tool ?? null,
        step.action ?? null,
        step.parameters ? JSON.stringify(step.parameters) : null,
        step.result !== undefined ? JSON.stringify(step.result) : null,
        step.error ?? null,
        step.startedAt ?? null,
        step.completedAt ?? null
      );
  },

  listSteps(executionId: string): ExecutionStep[] {
    const rows = getDb()
      .prepare("SELECT * FROM execution_steps WHERE execution_id = ? ORDER BY idx ASC")
      .all(executionId) as StepRow[];
    return rows.map(mapStep);
  },

  getStep(id: string): ExecutionStep | undefined {
    const row = getDb().prepare("SELECT * FROM execution_steps WHERE id = ?").get(id) as
      | StepRow
      | undefined;
    return row ? mapStep(row) : undefined;
  },

  /* ─── Approvals ─────────────────────────── */
  createApproval(approval: Approval): void {
    getDb()
      .prepare(
        `INSERT INTO approvals
          (id, execution_id, step_id, tool, action, parameters, description, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        approval.id,
        approval.executionId,
        approval.stepId,
        approval.tool,
        approval.action,
        JSON.stringify(approval.parameters),
        approval.description,
        approval.status,
        approval.createdAt
      );
  },

  getApproval(id: string): Approval | undefined {
    const row = getDb().prepare("SELECT * FROM approvals WHERE id = ?").get(id) as
      | ApprovalRow
      | undefined;
    return row ? mapApproval(row) : undefined;
  },

  listApprovals(status?: ApprovalStatus): Approval[] {
    const rows = (
      status
        ? getDb().prepare("SELECT * FROM approvals WHERE status = ? ORDER BY created_at ASC").all(status)
        : getDb().prepare("SELECT * FROM approvals ORDER BY created_at DESC").all()
    ) as ApprovalRow[];
    return rows.map(mapApproval);
  },

  resolveApproval(id: string, status: ApprovalStatus, now: string): void {
    getDb()
      .prepare("UPDATE approvals SET status = ?, resolved_at = ? WHERE id = ?")
      .run(status, now, id);
  },
};
