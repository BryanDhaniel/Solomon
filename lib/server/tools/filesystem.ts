import fs from "fs/promises";
import path from "path";
import { BaseTool } from "./base";
import { resolveWorkspacePath, workspaceDir } from "@/lib/server/workspace";
import type {
  ToolActionType,
  ToolDefinition,
  ToolInput,
  ToolOutput,
} from "@/lib/shared/types";

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function toWorkspaceRel(abs: string): string {
  const rel = path.relative(workspaceDir(), abs);
  return rel || ".";
}

async function listTree(dir: string, depth = 0, maxDepth = 3): Promise<string[]> {
  const entries: string[] = [];
  if (depth > maxDepth) return entries;
  const items = await fs.readdir(dir, { withFileTypes: true });
  items.sort((a, b) => {
    if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  for (const item of items) {
    const rel = toWorkspaceRel(path.join(dir, item.name));
    if (item.isDirectory()) {
      entries.push(`${rel}/`);
      entries.push(...(await listTree(path.join(dir, item.name), depth + 1, maxDepth)));
    } else {
      entries.push(rel);
    }
  }
  return entries;
}

export class FilesystemTool extends BaseTool {
  definition(): ToolDefinition {
    return {
      name: "filesystem",
      description:
        "Read and manage files inside the user's workspace. Scoped to the workspace directory only.",
      actions: [
        {
          action: "read_file",
          description: "Read the contents of a file in the workspace.",
          parameters: {
            path: { type: "string", description: "Path to the file, relative to the workspace." },
          },
        },
        {
          action: "write_file",
          description: "Write content to a file in the workspace.",
          parameters: {
            path: { type: "string", description: "Path to the file, relative to the workspace." },
            content: { type: "string", description: "Content to write to the file." },
          },
        },
        {
          action: "list_directory",
          description: "List the contents of a directory in the workspace.",
          parameters: {
            path: { type: "string", description: "Directory path, relative to the workspace." },
          },
        },
        {
          action: "create_directory",
          description: "Create a directory in the workspace.",
          parameters: {
            path: { type: "string", description: "Directory path to create, relative to the workspace." },
          },
        },
        {
          action: "delete_file",
          description: "Delete a file or directory from the workspace.",
          parameters: {
            path: { type: "string", description: "Path to delete, relative to the workspace." },
          },
        },
        {
          action: "search_files",
          description: "Search for files by name inside the workspace.",
          parameters: {
            query: { type: "string", description: "Substring to match against file names." },
          },
        },
      ],
      permissions: ["read_fs", "write_fs"],
    };
  }

  actionType(action: string): ToolActionType {
    switch (action) {
      case "write_file":
      case "create_directory":
      case "delete_file":
        return "irreversible";
      default:
        return "read_only";
    }
  }

  async execute(input: ToolInput): Promise<ToolOutput> {
    try {
      switch (input.action) {
        case "read_file": {
          const p = resolveWorkspacePath(asString(input.parameters.path));
          const content = await fs.readFile(p, "utf-8");
          return {
            success: true,
            data: { path: asString(input.parameters.path), content },
            metadata: { bytes: Buffer.byteLength(content) },
          };
        }
        case "write_file": {
          const rel = asString(input.parameters.path);
          const p = resolveWorkspacePath(rel);
          const content = asString(input.parameters.content);
          await fs.mkdir(path.dirname(p), { recursive: true });
          await fs.writeFile(p, content, "utf-8");
          return {
            success: true,
            data: { path: rel, bytes: Buffer.byteLength(content) },
          };
        }
        case "list_directory": {
          const rel = asString(input.parameters.path, ".");
          const p = resolveWorkspacePath(rel);
          const entries = await listTree(p);
          return { success: true, data: { path: rel || ".", entries } };
        }
        case "create_directory": {
          const rel = asString(input.parameters.path);
          const p = resolveWorkspacePath(rel);
          await fs.mkdir(p, { recursive: true });
          return { success: true, data: { path: rel } };
        }
        case "delete_file": {
          const rel = asString(input.parameters.path);
          const p = resolveWorkspacePath(rel);
          await fs.rm(p, { recursive: true, force: true });
          return { success: true, data: { path: rel } };
        }
        case "search_files": {
          const query = asString(input.parameters.query).toLowerCase();
          const p = resolveWorkspacePath(".");
          const matches: string[] = [];
          const walk = async (dir: string, depth = 0) => {
            if (depth > 6) return;
            const items = await fs.readdir(dir, { withFileTypes: true });
            for (const item of items) {
              const full = path.join(dir, item.name);
              if (item.isDirectory()) {
                await walk(full, depth + 1);
              } else if (item.name.toLowerCase().includes(query)) {
                matches.push(toWorkspaceRel(full));
              }
            }
          };
          await walk(p);
          return { success: true, data: { query, matches } };
        }
        default:
          return { success: false, error: `Unknown action: ${input.action}` };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: message };
    }
  }
}
