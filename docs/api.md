# Solomon — API Specification

## Overview
Solomon's API is a RESTful HTTP API with WebSocket support for real-time streaming. The API serves both the web frontend and external integrations (SDKs, CLI, third-party apps).

## Base URL
```
Production: https://api.solomon.ai/api/v1
Local:      http://localhost:8000/api/v1
```

## Authentication

### Session Auth (Web UI)
- Used by the Next.js frontend
- Better Auth session cookies
- CSRF protection

### API Key Auth (Programmatic)
- Header: `Authorization: Bearer sk-solomon-xxxxx`
- Keys managed via dashboard or API
- Scoped permissions per key

### OAuth (Tool Connections)
- GitHub OAuth for GitHub tool
- Google OAuth for Gmail tool
- Token storage and refresh handling

## Common Patterns
- All responses wrapped in: `{ "success": bool, "data": ..., "error": { "code": str, "message": str } }`
- Pagination: `?page=1&per_page=20` → response includes `{ "total": N, "page": 1, "per_page": 20 }`
- Filtering: Query parameters per resource
- Sorting: `?sort=created_at&order=desc`
- Rate limiting: 100 req/min for free tier, 1000 req/min for API keys
- Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## API Endpoints

### Authentication — `/api/v1/auth`

| Method | Path | Description | Request Body | Response Body | Error Codes |
|---|---|---|---|---|---|
| POST | `/auth/signup` | Create account | `{ "email": "...", "password": "..." }` | `{ "user": { "id": "..." } }` | 400, 409 |
| POST | `/auth/signin` | Sign in | `{ "email": "...", "password": "..." }` | `{ "user": { "id": "..." } }` | 400, 401 |
| POST | `/auth/signout` | Sign out | None | `{ "success": true }` | 401 |
| GET | `/auth/me` | Get current user | None | `{ "user": { "id": "..." } }` | 401 |
| POST | `/auth/api-keys` | Create API key | `{ "name": "...", "scopes": ["..."] }` | `{ "key": "sk-...", "id": "..." }` | 400, 401, 403 |
| GET | `/auth/api-keys` | List API keys | None | `{ "keys": [...] }` | 401 |
| DELETE | `/auth/api-keys/:id` | Revoke API key | None | `{ "success": true }` | 401, 403, 404 |
| GET | `/auth/connections` | List OAuth connections | None | `{ "connections": [...] }` | 401 |
| POST | `/auth/connections/:provider` | Initiate OAuth flow | None | `{ "url": "..." }` | 400, 401 |
| DELETE | `/auth/connections/:provider` | Disconnect OAuth | None | `{ "success": true }` | 401, 404 |

*Note: All endpoints wrap responses in the common pattern `{"success": true, "data": ...}`.*

### Conversations — `/api/v1/conversations`

**Authentication:** Session or API Key

| Method | Path | Description |
|---|---|---|
| POST | `/conversations` | Create new conversation |
| GET | `/conversations` | List conversations |
| GET | `/conversations/:id` | Get conversation with messages |
| DELETE | `/conversations/:id` | Delete conversation |
| POST | `/conversations/:id/messages` | Send message (triggers execution) |
| GET | `/conversations/:id/messages` | Get message history |

**Example: Send message**
The `POST /conversations/:id/messages` endpoint is the primary interaction point. It accepts a user message and triggers the full Solomon pipeline (plan → execute → respond). Response is streamed via WebSocket (if requested) or returns execution ID.

Request:
```json
{
  "content": "Review the open PRs on my repository",
  "stream": true
}
```

Response:
```json
{
  "success": true,
  "data": {
    "message_id": "msg_123",
    "execution_id": "exec_456"
  }
}
```

### Agents — `/api/v1/agents`

**Authentication:** Session or API Key

| Method | Path | Description |
|---|---|---|
| POST | `/agents` | Create agent (accepts YAML manifest) |
| GET | `/agents` | List agents (own + public) |
| GET | `/agents/:id` | Get agent details |
| PUT | `/agents/:id` | Update agent |
| DELETE | `/agents/:id` | Delete agent |
| POST | `/agents/:id/deploy` | Deploy agent |
| POST | `/agents/:id/undeploy` | Undeploy agent |
| GET | `/agents/:id/versions` | List agent versions |
| POST | `/agents/:id/invoke` | Invoke agent directly (API usage) |

**Example: Invoke agent**
Request:
```json
{
  "input": "Summarize my emails from today",
  "params": {}
}
```

Response:
```json
{
  "success": true,
  "data": {
    "execution_id": "exec_789",
    "status": "queued"
  }
}
```

### Executions — `/api/v1/executions`

**Authentication:** Session or API Key

| Method | Path | Description |
|---|---|---|
| GET | `/executions` | List executions |
| GET | `/executions/:id` | Get execution details (plan, steps, results) |
| GET | `/executions/:id/steps` | Get execution steps |
| GET | `/executions/:id/logs` | Get execution logs |

### Approvals — `/api/v1/approvals`

**Authentication:** Session or API Key

| Method | Path | Description |
|---|---|---|
| GET | `/approvals` | List pending approvals |
| POST | `/approvals/:id/approve` | Approve action |
| POST | `/approvals/:id/reject` | Reject action |

### Tools — `/api/v1/tools`

**Authentication:** Session or API Key

| Method | Path | Description |
|---|---|---|
| GET | `/tools` | List available tools |
| GET | `/tools/:name` | Get tool definition (actions, parameters, permissions) |

## WebSocket API

### Connection
```
ws://localhost:8000/ws?token=<session_token>
wss://api.solomon.ai/ws?token=<api_key>
```

### Events (Server → Client)

- `execution.started`: Execution begins
  ```json
  { "event": "execution.started", "data": { "execution_id": "exec_1" } }
  ```
- `execution.step`: A step in the plan is being executed
  ```json
  { "event": "execution.step", "data": { "step_id": "step_1", "description": "Search Github" } }
  ```
- `execution.tool_call`: A tool is being called
  ```json
  { "event": "execution.tool_call", "data": { "tool": "github", "action": "list_prs", "params": {} } }
  ```
- `execution.tool_result`: Tool returned a result
  ```json
  { "event": "execution.tool_result", "data": { "tool": "github", "result": "..." } }
  ```
- `execution.approval_required`: Human approval needed
  ```json
  { "event": "execution.approval_required", "data": { "approval_id": "appr_1", "action": "..." } }
  ```
- `execution.completed`: Execution finished
  ```json
  { "event": "execution.completed", "data": { "execution_id": "exec_1", "result": "..." } }
  ```
- `execution.error`: Execution failed
  ```json
  { "event": "execution.error", "data": { "error": "...", "code": "..." } }
  ```
- `message.chunk`: Streaming text chunk (for LLM responses)
  ```json
  { "event": "message.chunk", "data": { "text": "I found 3 open PRs..." } }
  ```
- `message.complete`: Full message ready
  ```json
  { "event": "message.complete", "data": { "message_id": "msg_2", "full_text": "..." } }
  ```

### Events (Client → Server)
- `message.send` — Send a user message
- `approval.respond` — Approve or reject
- `execution.cancel` — Cancel a running execution

## Error Codes

| HTTP Status | Error Code | Description | Example |
|---|---|---|---|
| 400 | `invalid_request` | The request was malformed or validation failed. | Missing required field `content`. |
| 401 | `unauthorized` | Missing or invalid authentication token. | Expired API key. |
| 403 | `forbidden` | Authenticated, but lacks required permissions. | Token does not have `agent:write` scope. |
| 404 | `not_found` | The requested resource does not exist. | Conversation ID not found. |
| 429 | `rate_limit_exceeded` | Too many requests. | Exceeded 1000 req/min. |
| 500 | `internal_error` | An unexpected server error occurred. | Database connection failed. |
| 503 | `service_unavailable` | External service (e.g., AI provider) is down. | OpenAI API timeout. |

## SDK Patterns

### Python SDK snippet
```python
from solomon import Solomon

client = Solomon(api_key="sk-solomon-xxxxx")

# Invoke an agent
execution = client.agents.invoke(
    agent_id="agt_123",
    input="Review open PRs on the frontend repo"
)

# Stream events
for event in execution.stream():
    if event.type == "message.chunk":
        print(event.data.text, end="")
    elif event.type == "execution.approval_required":
        client.approvals.approve(event.data.approval_id)
```

### JavaScript/TypeScript SDK snippet
```typescript
import { Solomon } from '@solomon/sdk';

const client = new Solomon({ apiKey: 'sk-solomon-xxxxx' });

async function run() {
  const stream = await client.agents.invokeStream('agt_123', {
    input: 'Review open PRs on the frontend repo'
  });

  stream.on('message.chunk', (chunk) => {
    process.stdout.write(chunk.text);
  });

  stream.on('execution.approval_required', async (approval) => {
    await client.approvals.approve(approval.id);
  });
}
```

### cURL example
```bash
curl -X POST https://api.solomon.ai/api/v1/agents/agt_123/invoke \
  -H "Authorization: Bearer sk-solomon-xxxxx" \
  -H "Content-Type: application/json" \
  -d '{"input": "Review open PRs on the frontend repo"}'
```

## Cross-References
- [Architecture Specification](./architecture.md)
- [Agent Specification](./agent-spec.md)
- [Tool Specification](./tool-spec.md)
- [MVP Features](./mvp.md)
