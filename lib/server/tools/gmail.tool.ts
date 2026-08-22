import { randomUUID } from "crypto";
import { BaseTool, asString } from "./base";
import type {
  ToolActionType,
  ToolDefinition,
  ToolInput,
  ToolOutput,
} from "@/lib/shared/types";


const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(input: ToolInput): string | null {
  const to = asString(input.parameters.to).trim();
  if (!to || !EMAIL_RE.test(to)) return "A valid 'to' email address is required.";
  const subject = asString(input.parameters.subject).trim();
  if (!subject) return "A non-empty 'subject' is required.";
  const body = asString(input.parameters.body).trim();
  if (!body) return "A non-empty 'body' is required.";
  return null;
}

/**
 * Simulated Gmail. Drafting is reversible; sending is irreversible and is
 * blocked by the execution engine's human-approval gate before `execute` runs.
 */
export class GmailTool extends BaseTool {
  definition(): ToolDefinition {
    return {
      name: "gmail",
      description: "Draft and send email on the user's behalf. Sending requires approval.",
      actions: [
        {
          action: "draft_email",
          description: "Compose an email draft for review.",
          parameters: {
            to: { type: "string", description: "Recipient email address." },
            subject: { type: "string", description: "Email subject line." },
            body: { type: "string", description: "Email body text." },
          },
        },
        {
          action: "send_email",
          description: "Send an email. Irreversible — always gated behind user approval.",
          parameters: {
            to: { type: "string", description: "Recipient email address." },
            subject: { type: "string", description: "Email subject line." },
            body: { type: "string", description: "Email body text." },
          },
        },
      ],
      permissions: ["read_email", "send_email"],
    };
  }

  actionType(action: string): ToolActionType {
    return action === "send_email" ? "irreversible" : "reversible";
  }

  async execute(input: ToolInput): Promise<ToolOutput> {
    const invalid = validate(input);
    if (invalid) return { success: false, error: invalid };

    const to = asString(input.parameters.to).trim();
    const subject = asString(input.parameters.subject).trim();
    const body = asString(input.parameters.body);

    switch (input.action) {
      case "draft_email":
        return {
          success: true,
          data: { draftId: `draft_${randomUUID().slice(0, 8)}`, to, subject, body, status: "drafted" },
          metadata: { simulated: true },
        };
      case "send_email":
        return {
          success: true,
          data: {
            messageId: `msg_${randomUUID().slice(0, 10)}`,
            to,
            subject,
            status: "sent",
            sentAt: new Date().toISOString(),
          },
          metadata: { simulated: true },
        };
      default:
        return { success: false, error: `Unknown action: ${input.action}` };
    }
  }
}
