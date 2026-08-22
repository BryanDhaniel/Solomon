import { randomUUID } from "crypto";
import type { ComposeContext, LLM, PlanContext, SkillContent } from "./types";
import type { Plan, Step, StepResult } from "@/lib/shared/types";

function step(
  type: Step["type"],
  description: string,
  extra: Partial<Step> = {}
): Step {
  return { id: randomUUID(), type, description, ...extra };
}

function hasTool(ctx: PlanContext, tool: string): boolean {
  return ctx.tools.some((d) => d.name.toLowerCase() === tool);
}

const EMAIL_RE = /[^\s<>,;"]+@[^\s<>,;"]+\.[^\s<>,;"]+/;
const URL_RE = /https?:\/\/[^\s,;)]+/i;

function extractQuery(input: string): string {
  return input
    .replace(/^(please\s+)?(can you\s+)?(research|search( for)?|look\s?up|find( out)?( about)?)\s*:?\s*/i, "")
    .replace(/\?+$/, "")
    .trim() || input.trim();
}

function extractEmailParams(input: string): { to?: string; subject: string } {
  const to = input.match(EMAIL_RE)?.[0];
  let subject = input
    .replace(EMAIL_RE, "")
    .replace(/\b(draft|send|write|compose|an?|the|email|mail|gmail|to|about|announcing)\b/gi, " ")
    .replace(/[^\w\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (subject.length > 60) subject = `${subject.slice(0, 57)}…`;
  return { to, subject: subject ? subject.charAt(0).toUpperCase() + subject.slice(1) : "A message from Solomon" };
}

function skillExcerpt(body: string): string {
  const firstPara =
    body.split(/\n\s*\n/).find((p) => p.trim() && !p.trim().startsWith("#")) ?? "";
  const text = firstPara
    .replace(/[#*`>-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 160 ? `${text.slice(0, 157)}…` : text;
}

/** The injected Skills are the agent's operating guidance; surface it in prose replies. */
function buildSkillsNote(ctx?: ComposeContext): string {
  const skills: SkillContent[] = ctx?.skills ?? [];
  if (skills.length === 0) return "";
  const lines = skills.map((s) => `- **${s.title}** — ${skillExcerpt(s.body) || "guidance loaded."}`);
  return `\n\n_Guided by ${skills.length === 1 ? "the" : `${skills.length}`} skill${skills.length === 1 ? "" : "s"} I operate with:_\n${lines.join("\n")}`;
}

export class MockLLM implements LLM {
  readonly name = "mock";

  async createPlan(ctx: PlanContext): Promise<Plan> {
    const { input, attachment } = ctx;
    const l = input.toLowerCase();

    // ── Browse a URL (needs `browse`) ──────────────────────────────
    const url = input.match(URL_RE)?.[0] ?? (/\b(browse|open|read)\b/i.test(l) && /\b[a-z0-9-]+\.(com|org|io|net|dev|ai)\b/i.test(l) ? `https://${l.match(/\b[a-z0-9-]+\.(com|org|io|net|dev|ai)\b/i)?.[0]}` : null);
    if (url && hasTool(ctx, "browse")) {
      return {
        steps: [
          step("think", "Understanding the request"),
          step("tool_call", `Browsing ${url}`, {
            tool: "browse",
            action: "navigate",
            parameters: { url },
          }),
          step("respond", "Summarizing the page"),
        ],
      };
    }

    // ── Research (needs `search`) ──────────────────────────────────
    if (/\b(research|search|look\s?up|find( out)?)\b/i.test(l) && hasTool(ctx, "search")) {
      const query = extractQuery(input);
      return {
        steps: [
          step("think", "Understanding the request"),
          step("tool_call", `Searching the web for "${query}"`, {
            tool: "search",
            action: "search",
            parameters: { query },
          }),
          step("respond", "Summarizing the findings"),
        ],
      };
    }

    // ── Email (needs `gmail`) ──────────────────────────────────────
    if (/\b(email|mail|gmail)\b|(draft|send|compose)\s+(an?\s+)?(email|mail)/i.test(l) && hasTool(ctx, "gmail")) {
      const { to, subject } = extractEmailParams(input);
      if (!to) {
        return {
          steps: [
            step("think", "Understanding the request"),
            step(
              "respond",
              "Asking for the recipient",
              {
                content:
                  "I can draft that email — what's the recipient's email address?",
              }
            ),
          ],
        };
      }
      const body =
        input.match(/(?:saying|that says|with (?:the )?(?:message|body)|content)[:\s]+(.+)/i)?.[1]?.trim() ??
        `Hi,\n\n${input.replace(EMAIL_RE, "").trim()}\n\nBest,\nSolomon (on your behalf)`;
      return {
        steps: [
          step("think", "Understanding the request"),
          step("tool_call", `Drafting email to ${to}`, {
            tool: "gmail",
            action: "draft_email",
            parameters: { to, subject, body },
          }),
          step("tool_call", `Sending email to ${to}`, {
            tool: "gmail",
            action: "send_email",
            parameters: { to, subject, body },
          }),
          step("respond", "Confirming the send"),
        ],
      };
    }

    // ── Code review (needs `code_review`) ─────────────────────────
    const reviewIntent = /\b(review|check|audit|look over|go over)\b/i.test(l) && /(code|file|attachment|snippet|script|program)/i.test(l);
    if (reviewIntent && attachment && hasTool(ctx, "code_review")) {
      return {
        steps: [
          step("think", "Reading the uploaded file"),
          step("tool_call", `Reviewing ${attachment.name}`, {
            tool: "code_review",
            action: "review",
            parameters: { fileName: attachment.name, code: attachment.content },
          }),
          step("respond", "Writing up the review"),
        ],
      };
    }

    // Generic fallback — also covers requests for tools this agent lacks.
    return {
      steps: [
        step("think", "Understanding the request"),
        step("respond", "Answering"),
      ],
    };
  }

  async composeResponse(input: string, results: StepResult[], ctx?: ComposeContext): Promise<string> {
    const toolSteps = results.filter((r) => r.tool);

    if (toolSteps.length > 0) {
      const lines: string[] = [];
      for (const r of toolSteps) {
        if (r.error) {
          lines.push(`I ran into a problem with \`${r.tool}.${r.action}\`:\n\n> ${r.error}`);
          continue;
        }
        switch (`${r.tool}.${r.action}`) {
          case "search.search": {
            const data = r.result as { results?: { title: string; url: string; snippet: string }[] } | undefined;
            const items = data?.results ?? [];
            lines.push(
              `Here's what I found:\n\n${items
                .map((it) => `- **[${it.title}](${it.url})**\n  ${it.snippet}`)
                .join("\n")}`
            );
            break;
          }
          case "browse.navigate": {
            const data = r.result as { url?: string; title?: string; sections?: string[] } | undefined;
            lines.push(
              `[${data?.title ?? "Page"}](${data?.url ?? ""}):\n\n${(data?.sections ?? [])
                .map((s) => `- ${s}`)
                .join("\n")}`
            );
            break;
          }
          case "gmail.draft_email": {
            const data = r.result as { to?: string; subject?: string; body?: string } | undefined;
            lines.push(
              `Draft ready:\n\n> **To:** ${data?.to}\n> **Subject:** ${data?.subject}\n>\n${(data?.body ?? "")
                .split("\n")
                .map((ln) => `> ${ln}`)
                .join("\n")}`
            );
            break;
          }
          case "gmail.send_email": {
            const data = r.result as { messageId?: string; to?: string } | undefined;
            lines.push(`Sent ✓ — delivered to ${data?.to} (id \`${data?.messageId}\`).`);
            break;
          }
          case "code_review.review": {
            const data = r.result as {
              fileName?: string;
              verdict?: string;
              findings?: { severity: string; title: string; detail: string }[];
            } | undefined;
            const icon = (s: string) => (s === "high" ? "🔴" : s === "medium" ? "🟡" : "🟢");
            lines.push(
              `Reviewing **${data?.fileName ?? "file"}**: ${data?.verdict ?? "done"}.\n\n${
                (data?.findings ?? [])
                  .map((f) => `- ${icon(f.severity)} **${f.title}** — ${f.detail}`)
                  .join("\n") || "No issues surfaced by the checklist."
              }`
            );
            break;
          }
          default:
            lines.push(`Done — completed \`${r.action}\`.`);
        }
      }
      return lines.join("\n\n");
    }

    const skillsNote = buildSkillsNote(ctx);

    return `Understood. Here's how I'd think through **${input.trim() || "that"}**:

The key is separating what's urgent from what's important. First, define the constraint — time, budget, scope, or headcount — because optimizing for speed looks very different from optimizing for quality. Next, map the dependencies to find the critical path. Finally, agree on explicit exit criteria up front, since "done" means something different to everyone.

I can go deeper on any of these, or point me at a concrete task — research, browsing a page, drafting an email, or reviewing attached code.${skillsNote}`;
  }
}
