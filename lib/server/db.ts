import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "solomon.db");

let db: Database.Database | null = null;

function migrate(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      pinned INTEGER NOT NULL DEFAULT 0,
      project_id TEXT,
      agent_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      skill_names TEXT NOT NULL DEFAULT '[]',
      tool_names TEXT NOT NULL DEFAULT '[]',
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS executions (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      completed_at TEXT,
      result TEXT,
      error TEXT
    );

    CREATE TABLE IF NOT EXISTS execution_steps (
      id TEXT PRIMARY KEY,
      execution_id TEXT NOT NULL,
      idx INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL,
      tool TEXT,
      action TEXT,
      parameters TEXT,
      result TEXT,
      error TEXT,
      started_at TEXT,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      execution_id TEXT NOT NULL,
      step_id TEXT NOT NULL,
      tool TEXT NOT NULL,
      action TEXT NOT NULL,
      parameters TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      resolved_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_executions_conversation ON executions(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_steps_execution ON execution_steps(execution_id);
    CREATE INDEX IF NOT EXISTS idx_approvals_execution ON approvals(execution_id);
  `);

  const cols = database.prepare("PRAGMA table_info(conversations)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "pinned")) {
    database.exec("ALTER TABLE conversations ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0");
  }
  if (!cols.some((c) => c.name === "project_id")) {
    database.exec("ALTER TABLE conversations ADD COLUMN project_id TEXT");
  }
  if (!cols.some((c) => c.name === "agent_id")) {
    database.exec("ALTER TABLE conversations ADD COLUMN agent_id TEXT");
  }

  seedDefaultAgent(database);
}

const DEFAULT_SKILLS = [
  "how-to-research",
  "professional-email",
  "web-browsing",
  "code-review-checklist",
];
const DEFAULT_TOOLS = ["search", "browse", "gmail", "code_review"];

function seedDefaultAgent(database: Database.Database) {
  const row = database.prepare("SELECT id FROM agents WHERE is_default = 1").get();
  if (row) return;
  database
    .prepare(
      `INSERT INTO agents (id, name, description, skill_names, tool_names, is_default, created_at)
       VALUES (?, 'Solomon', 'The default Solomon Agent — researches the web, browses pages, drafts and sends email with your approval, and reviews uploaded code.', ?, ?, 1, ?)`
    )
    .run(randomUUID(), JSON.stringify(DEFAULT_SKILLS), JSON.stringify(DEFAULT_TOOLS), new Date().toISOString());
}

export function getDb(): Database.Database {
  if (!db) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    migrate(db);
  }
  return db;
}
