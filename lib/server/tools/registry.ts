import { BaseTool } from "./base";
import { FilesystemTool } from "./filesystem";
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

export function initToolRegistry(): void {
  if (tools.size > 0) return;
  registerTool(new FilesystemTool());
}
