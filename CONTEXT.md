# Solomon

A cloud Agent-as-a-Service website. Every conversation runs an **Agent** — a package of **Skills** (how the AI works) and **Tools** (what it can do) — that plans and executes tasks for the user, asking approval before risky actions.

## Language

### Core

**Agent**:
A packaged AI capability composed of Skills + Tools. Users converse with an Agent; it defines what the AI can do and how it behaves.
_Avoid_: Assistant, bot, chatbot, worker

**Solomon**:
The default system Agent, seeded automatically. Conversations run Solomon unless another Agent is chosen.
_Avoid_: "the assistant", "the AI"

**Skill**:
Instructions (markdown) defining _how_ the AI should approach a type of task — procedures, rules, best practices. A Skill performs no action itself. An Agent's Skills are injected whole into its prompt.
_Avoid_: Prompt, template, playbook

**Tool**:
A capability the AI uses to _act_ on the world (search, browse, send email, review code). Tools have typed actions: read-only, reversible, or irreversible.
_Avoid_: Integration, plugin, function

**Task**:
A user request that the Agent plans into steps and executes.
_Avoid_: Job, request, command

### Execution

**Plan**:
The ordered steps an Agent produces for a Task: think / tool_call / respond.

**Execution**:
One run of a Plan against a Conversation; tracked with a step timeline.
_Avoid_: Run, job

**Approval**:
A human gate required before any irreversible Tool action executes (e.g. sending email).
_Avoid_: Confirmation, permission

**Attachment**:
A user-uploaded text file bound to a message; how code reaches the `code_review` Tool.
_Avoid_: Upload, file (unqualified)

### Organization

**Conversation**:
A chat session bound to exactly one Agent (`agentId`, default Solomon).
_Avoid_: Chat (when referring to the stored entity), thread, session

**Project**:
A user-made grouping of Conversations.
_Avoid_: Workspace, folder
