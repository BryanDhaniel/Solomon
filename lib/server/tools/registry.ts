import { BaseTool } from "./base";
import { SearchTool } from "./search.tool";
import { BrowseTool } from "./browse.tool";
import { GmailTool } from "./gmail.tool";
import { CodeReviewTool } from "./code-review.tool";
import type { ToolDefinition } from "@/lib/shared/types";

const tools = new Map<string, BaseTool>();

export function registerTool(tool: BaseTool): void {
  tools.set(tool.definition().name.toLowerCase(), tool);
}

export function getTool(name: string): BaseTool | undefined {
  return tools.get(name.toLowerCase());
}

export function listTools(): ToolDefinition[] {
  return [...tools.values()].map((t) => t.definition());
}

registerTool(new SearchTool());
registerTool(new BrowseTool());
registerTool(new GmailTool());
registerTool(new CodeReviewTool());
