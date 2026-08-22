# Agents compose Skills (markdown, injected wholesale) + Tools

## Status

accepted

## Context

Solomon's objective was redefined mid-build: it is a cloud Agent-as-a-Service where every conversation runs an **Agent**. Two earlier framings were rejected: a generic assistant with hardcoded capabilities, and the original spec's deployable YAML "agent manifests" with a marketplace.

We needed a composition model for what an Agent is made of.

## Decision

An **Agent = Skills + Tools**.

- **Skills** are markdown files (`skills/<name>/SKILL.md`, name + description frontmatter) containing procedures and rules for _how_ to do a type of task. In v1, an Agent's Skills are injected **whole** into its system prompt — no relevance ranking or per-task selection.
- **Tools** are registered capabilities with typed actions (read-only / reversible / irreversible). An Agent names the Tools it may use; the planner will only plan actions for Tools the Agent has.

Skill content is task-oriented (research, email, browsing, code review) and authored by us in v1 — no user-authored skills, no marketplace.

## Considered options

- **Per-task skill selection** (planner picks relevant skills by description) — deferred: unpredictable and hard to debug at v1 scale; an Agent has few skills, so wholesale injection costs little.
- **YAML agent manifests with versioning/permissions** (original `agent-spec.md`) — superseded: heavy for a single-user v1; the manifest fields collapse naturally into an Agent row referencing Skills + Tools by name.
- **Hardcoding capabilities into the assistant** — rejected: contradicts extensibility; every capability must be a Tool or Skill.

## Consequences

- Adding a Skill is dropping a markdown file; adding a Tool is implementing `BaseTool` and registering it.
- Agents reference Skills/Tools **by name**; renaming either orphans references until updated on the Agent.
- Wholesale injection means prompt size grows linearly with an Agent's Skill count — revisit injection strategy if that count becomes large.
