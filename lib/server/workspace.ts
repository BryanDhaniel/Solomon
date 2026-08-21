import path from "path";
import fs from "fs";

/**
 * The filesystem tool is scoped to a single workspace directory at the repo
 * root. All relative paths supplied by the planner resolve inside it, and any
 * path that escapes the workspace is rejected.
 */
export function workspaceDir(): string {
  const dir = path.join(process.cwd(), "workspace");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function resolveWorkspacePath(relPath: string): string {
  const base = workspaceDir();
  const normalized = relPath.replace(/^[/\\]+/, "");
  const resolved = path.resolve(base, normalized || ".");
  if (resolved !== base && !resolved.startsWith(base + path.sep)) {
    throw new Error(`Path escapes workspace: ${relPath}`);
  }
  return resolved;
}
