import { BaseTool, asString } from "./base";
import type {
  ToolActionType,
  ToolDefinition,
  ToolInput,
  ToolOutput,
} from "@/lib/shared/types";

type Finding = {
  severity: "high" | "medium" | "low";
  symbol: string;
  title: string;
  detail: string;
};


/**
 * Reviews an uploaded text file's code. The heuristics here run on the real
 * uploaded content (so findings are genuine), while the surrounding report is
 * deliberately lightweight — a live LLM-backed reviewer can replace `execute`
 * later without changing the contract.
 */
export class CodeReviewTool extends BaseTool {
  definition(): ToolDefinition {
    return {
      name: "code_review",
      description: "Review an uploaded code file for bugs, risk, and clarity.",
      actions: [
        {
          action: "review",
          description: "Review the provided code content.",
          parameters: {
            fileName: { type: "string", description: "Name of the uploaded file." },
            code: { type: "string", description: "Full text content of the file." },
          },
        },
      ],
      permissions: ["read_attachments"],
    };
  }

  actionType(_action: string): ToolActionType {
    return "read_only";
  }

  async execute(input: ToolInput): Promise<ToolOutput> {
    if (input.action !== "review") {
      return { success: false, error: `Unknown action: ${input.action}` };
    }
    const fileName = asString(input.parameters.fileName, "uploaded file");
    const code = asString(input.parameters.code);
    if (!code.trim()) {
      return { success: false, error: `No readable code found in ${fileName}.` };
    }
    if (code.length > 200_000) {
      return { success: false, error: `${fileName} is too large to review (max ~200KB).` };
    }

    const findings: Finding[] = [];
    const has = (re: RegExp) => re.test(code);

    if (has(/==[^=]/)) {
      findings.push({
        severity: "medium",
        symbol: "comparisons",
        title: "Loose equality used",
        detail: "`==` performs type coercion and hides bugs. Prefer strict `===` unless comparing against null/undefined deliberately.",
      });
    }
    if (has(/\bvar\s+\w/)) {
      findings.push({
        severity: "low",
        symbol: "declarations",
        title: "`var` declarations present",
        detail: "`var` is function-scoped and hoisted; switch to `const`/`let` to avoid accidental rebinding.",
      });
    }
    if (has(/catch\s*\([^)]*\)\s*\{\s*\}/)) {
      findings.push({
        severity: "high",
        symbol: "catch blocks",
        title: "Empty catch block",
        detail: "Errors are silently swallowed. At minimum log the error or rethrow a domain-specific one.",
      });
    }
    if (has(/TODO|FIXME|HACK/)) {
      findings.push({
        severity: "low",
        symbol: "comments",
        title: "Unresolved TODO/FIXME markers",
        detail: "Left-in markers usually mean unfinished work. Resolve them or track them in an issue.",
      });
    }
    if (has(/(api[_-]?key|secret|password|token)\s*[:=]\s*["'][^"']{8,}["']/i)) {
      findings.push({
        severity: "high",
        symbol: "constants",
        title: "Possible hard-coded secret",
        detail: "A literal that looks like a credential is embedded in source. Move it to environment configuration.",
      });
    }
    if (!has(/try\s*\{/) && has(/await\s+/) && has(/fetch|query|read|write/i)) {
      findings.push({
        severity: "medium",
        symbol: "async paths",
        title: "Awaited I/O without visible error handling",
        detail: "Asynchronous calls can reject. Wrap risky awaits or attach rejection handling so failures are observable.",
      });
    }

    const verdict =
      findings.some((f) => f.severity === "high")
        ? "has issues"
        : findings.length > 0
          ? "mostly sound"
          : "sound";

    return {
      success: true,
      data: { fileName, lines: code.split("\n").length, verdict, findings },
      metadata: { simulated: true },
    };
  }
}
