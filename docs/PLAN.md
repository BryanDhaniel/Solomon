# Solomon — Plan

> **Cloud Agent-as-a-Service (AaaS)**
> Every conversation runs an **Agent** — a package of **Skills** (how the AI works) + **Tools** (what it can do).
> `Agent = Skills + Tools` · Skills = how · Tools = what · See [CONTEXT.md](../CONTEXT.md) for the canonical language.

This is the single source of truth for what Solomon is and what v1 ships. The older specs (`vision.md`, `mvp.md`, `architecture.md`, `agent-spec.md`, `tool-spec.md`, `api.md`, `roadmap.md`) are **superseded** — kept for history, describing the pre-pivot platform.

---

## Objective

Build a cloud AI agent website where users accomplish tasks by chatting with Agents that plan, use tools, and ask approval before risky actions. Success = tasks completed end-to-end without the user doing manual steps.

## Domain model

- **Agent = Skills + Tools.** Solomon is the default system Agent, seeded automatically.
- **Skill**: markdown instructions for _how_ to approach a task type. Injected whole into the Agent's prompt. Authored by us in v1.
- **Tool**: a capability with typed actions — `read_only`, `reversible`, `irreversible` (irreversible ⇒ human **Approval** gate).
- **Conversation**: bound to one Agent; groups messages, executions, approvals.
- **Project**: user grouping of conversations.
- Decisions: [ADR-0001](./adr/0001-agents-compose-skills-and-tools.md)

## Users & constraints

- Primary user: individual knowledge worker ("send this email", not "how do I send an email").
- Single user in a browser for v1. **Auth deferred** until something is shared or deployed.
- Next.js-first: API routes + SQLite + SSE streaming (WebSocket event model preserved in the SSE payloads). Mock LLM behind a swappable `LLM` interface; tools simulated behind the `BaseTool` contract so real providers drop in later.

## v1 scope

| Area | Ships |
|---|---|
| Agents | Default Solomon Agent seeded; create/edit Agents (name, description, tick Skills + Tools); conversations record their Agent |
| Skills | 4 task skills as markdown: how-to-research, professional-email, web-browsing, code-review-checklist |
| Tools | `search` (web search) · `browse` (open URL) · `gmail` (draft → approval-gated send) · `code_review` (uploaded text file) |
| Planner | Agent-aware: plans only actions for the Agent's Tools; Skills shape behavior via injection |
| Chat | Streaming responses, execution timeline, approval cards, attachments for code review |
| Organization | History (pin / rename / delete / add-to-project), Projects |

## Non-goals (v1)

Auth/multi-user · real provider integrations · skill relevance selection · agent marketplace/sharing/URLs · code execution or DB tools · mid-conversation agent switching · voice/mobile/billing/analytics.

## Milestones

1. **Docs & domain reset** — CONTEXT.md, ADR-0001, this file, superseded banners, task Skills.
2. **Agent model** — schema, seeding, CRUD API, conversation↔agent binding.
3. **Tools** — four simulated tools behind `BaseTool`; gmail send gated.
4. **Planner** — agent-aware intents; email demo loop: draft → preview → approve → send.
5. **UI** — Agents nav + detail page; attachment upload; agent name in chat header.
6. **Verify** — lint/build clean; end-to-end smoke of each tool path.
