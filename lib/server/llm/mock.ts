import { randomUUID } from "crypto";
import type { LLM } from "./types";
import type { Plan, Step, StepResult } from "@/lib/shared/types";

function step(
  type: Step["type"],
  description: string,
  extra: Partial<Step> = {}
): Step {
  return { id: randomUUID(), type, description, ...extra };
}

function extractPath(input: string, fallback: string): string {
  const quoted = input.match(/["'`]([^"'`]+)["'`]/);
  if (quoted) return quoted[1].trim();

  const named = input.match(/(?:named|called)\s+(\S+)/i);
  if (named) return named[1].replace(/[,.;:]+$/, "").trim();

  const withExt = input.match(/([\w./-]+\.(?:txt|md|json|ts|tsx|js|jsx|yaml|yml|csv|html|css))/i);
  if (withExt) return withExt[1].trim();

  const slashed = input.match(/([a-zA-Z0-9_-]+\/[a-zA-Z0-9_./-]+)/);
  if (slashed) return slashed[1].trim();

  return fallback;
}

function extractContent(input: string, fallback: string): string {
  const quoted = input.match(/["'`]([\s\S]+)["'`]/);
  if (quoted) return quoted[1].trim();

  const patterns = [
    /(?:with\s+(?:the\s+)?content|containing|that\s+says|saying|reading|content)\s*[:]?\s*(.+)/i,
  ];
  for (const p of patterns) {
    const m = input.match(p);
    if (m) return m[1].trim();
  }
  return fallback;
}

function pickPath(input: string, dirDefault: string): string {
  const p = extractPath(input, dirDefault);
  return p.replace(/^\.\//, "");
}

export class MockLLM implements LLM {
  readonly name = "mock";

  async createPlan(input: string): Promise<Plan> {
    const l = input.toLowerCase();

    // List directory
    if (/\b(list|ls|show|what('|’)?s in|what is in)\b/.test(l) && /(files|workspace|directory|folder|dir|\.)/.test(l)) {
      const dir = pickPath(input, ".");
      return {
        steps: [
          step("think", "Understanding the request"),
          step("tool_call", `Listing workspace files`, {
            tool: "filesystem",
            action: "list_directory",
            parameters: { path: dir },
          }),
          step("respond", "Summarizing what's in the workspace"),
        ],
      };
    }

    // Read file
    if (/\b(read|cat|open|show (me )?the (content|contents) of)\b/.test(l) && /(file|\.\w+|\/)/.test(l)) {
      const p = pickPath(input, "notes.txt");
      return {
        steps: [
          step("think", "Understanding the request"),
          step("tool_call", `Reading ${p}`, {
            tool: "filesystem",
            action: "read_file",
            parameters: { path: p },
          }),
          step("respond", "Summarizing the file contents"),
        ],
      };
    }

    // Create directory
    if (/\b(create|make|mkdir)( a)? (folder|directory|dir)\b/.test(l) || /\bmkdir\b/.test(l)) {
      const p = pickPath(input, "new-folder");
      return {
        steps: [
          step("think", "Understanding the request"),
          step("tool_call", `Creating directory ${p}`, {
            tool: "filesystem",
            action: "create_directory",
            parameters: { path: p },
          }),
          step("respond", "Confirming the directory was created"),
        ],
      };
    }

    // Write / create file
    if (/\b(write|create|make|save|draft)\b/.test(l) && /(file|\.\w+)/.test(l)) {
      const p = pickPath(input, "note.txt");
      const content = extractContent(input, "Solomon wrote this file.");
      return {
        steps: [
          step("think", "Understanding the request"),
          step("tool_call", `Writing ${p}`, {
            tool: "filesystem",
            action: "write_file",
            parameters: { path: p, content },
          }),
          step("respond", "Confirming the file was written"),
        ],
      };
    }

    // Delete
    if (/\b(delete|remove|rm)\b/.test(l) && /(file|folder|directory|\.\w+|\/)/.test(l)) {
      const p = pickPath(input, "note.txt");
      return {
        steps: [
          step("think", "Understanding the request"),
          step("tool_call", `Deleting ${p}`, {
            tool: "filesystem",
            action: "delete_file",
            parameters: { path: p },
          }),
          step("respond", "Confirming the deletion"),
        ],
      };
    }

    // Search files
    if (/\b(search|find)\b/.test(l) && /(file|files)/.test(l)) {
      const query = extractPath(input, "note");
      return {
        steps: [
          step("think", "Understanding the request"),
          step("tool_call", `Searching for "${query}"`, {
            tool: "filesystem",
            action: "search_files",
            parameters: { query },
          }),
          step("respond", "Summarizing the search results"),
        ],
      };
    }

    // Generic fallback
    return {
      steps: [
        step("think", "Understanding the request"),
        step("respond", "Answering"),
      ],
    };
  }

  async composeResponse(input: string, results: StepResult[]): Promise<string> {
    const toolSteps = results.filter((r) => r.tool);

    if (toolSteps.length === 0) {
      return `Understood. Here's how I'd think through **${input.trim() || "that"}**:

The key is separating what's urgent from what's important. First, define the constraint — time, budget, scope, or headcount — because optimizing for speed looks very different from optimizing for quality. Next, map the dependencies to find the critical path. Finally, agree on explicit exit criteria up front, since "done" means something different to everyone.

I'm currently running in mock mode with the **filesystem** tool available. Try asking me to *list files*, *read a file*, *write a file*, or *create a folder* and I'll plan and execute it for you.`;
    }

    const lines: string[] = [];
    for (const r of toolSteps) {
      if (r.error) {
        lines.push(`I ran into a problem with \`${r.action}\`:\n\n> ${r.error}`);
        continue;
      }
      switch (r.action) {
        case "list_directory": {
          const data = r.result as { path?: string; entries?: string[] } | undefined;
          const entries = data?.entries ?? [];
          const dir = data?.path === "." || data?.path === "" ? "your workspace" : data?.path ?? "your workspace";
          lines.push(
            `Here's what's in **${dir}**${entries.length ? "" : " (it's empty)"}:\n\n${entries
              .map((e) => `- \`${e}\``)
              .join("\n")}`
          );
          break;
        }
        case "read_file": {
          const data = r.result as { path?: string; content?: string } | undefined;
          const content = data?.content ?? "";
          lines.push(
            `Here are the contents of \`${data?.path ?? ""}\`:\n\n\`\`\`\n${content}\n\`\`\``
          );
          break;
        }
        case "write_file": {
          const data = r.result as { path?: string; bytes?: number } | undefined;
          lines.push(`Wrote \`${data?.path ?? ""}\` (${data?.bytes ?? 0} bytes).`);
          break;
        }
        case "create_directory": {
          const data = r.result as { path?: string } | undefined;
          lines.push(`Created directory \`${data?.path ?? ""}\`.`);
          break;
        }
        case "delete_file": {
          const data = r.result as { path?: string } | undefined;
          lines.push(`Deleted \`${data?.path ?? ""}\`.`);
          break;
        }
        case "search_files": {
          const data = r.result as { query?: string; matches?: string[] } | undefined;
          const matches = data?.matches ?? [];
          lines.push(
            `Searching for \`${data?.query ?? ""}\` found ${matches.length} match${matches.length === 1 ? "" : "es"}:\n\n${matches
              .map((m) => `- \`${m}\``)
              .join("\n")}`
          );
          break;
        }
        default: {
          lines.push(`Done — completed \`${r.action}\`.`);
        }
      }
    }

    return lines.join("\n\n");
  }
}
