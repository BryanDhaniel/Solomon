export type Role = "user" | "assistant";

export type Conversation = {
  id: string;
  title: string;
  pinned: boolean;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Project = {
  id: string;
  name: string;
  createdAt: string;
};

export type Message = {
  id: string;
  conversationId: string;
  role: Role;
  content: string;
  createdAt: string;
};

/* ─── Tool contract ─────────────────────────── */

export type ToolActionType = "read_only" | "reversible" | "irreversible";

export type ToolParameterSchema = {
  type: string;
  description?: string;
  items?: { type: string };
  properties?: Record<string, ToolParameterSchema>;
};

export type ToolAction = {
  action: string;
  description: string;
  parameters: Record<string, ToolParameterSchema>;
};

export type ToolDefinition = {
  name: string;
  description: string;
  actions: ToolAction[];
  permissions: string[];
};

export type ToolInput = {
  action: string;
  parameters: Record<string, unknown>;
};

export type ToolOutput = {
  success: boolean;
  data?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
};

/* ─── Plan ──────────────────────────────────── */

export type StepType = "think" | "tool_call" | "respond";

export type Step = {
  id: string;
  type: StepType;
  description: string;
  tool?: string;
  action?: string;
  parameters?: Record<string, unknown>;
  content?: string;
};

export type Plan = {
  steps: Step[];
};

/* ─── Execution ─────────────────────────────── */

export type StepStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "awaiting_approval";

export type ExecutionStep = {
  id: string;
  executionId: string;
  index: number;
  type: StepType;
  description: string;
  status: StepStatus;
  tool?: string;
  action?: string;
  parameters?: Record<string, unknown>;
  result?: unknown;
  error?: string;
  startedAt?: string;
  completedAt?: string;
};

export type ExecutionStatus =
  | "running"
  | "awaiting_approval"
  | "completed"
  | "failed"
  | "cancelled";

export type Execution = {
  id: string;
  conversationId: string;
  status: ExecutionStatus;
  createdAt: string;
  completedAt?: string;
  result?: string;
  error?: string;
};

/* ─── Approval ──────────────────────────────── */

export type ApprovalStatus = "pending" | "approved" | "rejected";

export type Approval = {
  id: string;
  executionId: string;
  stepId: string;
  tool: string;
  action: string;
  parameters: Record<string, unknown>;
  description: string;
  status: ApprovalStatus;
  createdAt: string;
  resolvedAt?: string;
};

/* ─── Execution step result (for composing) ─── */

export type StepResult = {
  stepId: string;
  description: string;
  tool?: string;
  action?: string;
  result?: unknown;
  error?: string;
};
