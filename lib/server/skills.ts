import fs from "fs";
import path from "path";

export type SkillSummary = {
  name: string;
  title: string;
  description: string;
};

export type SkillDetail = SkillSummary & {
  body: string;
};

const SKILLS_DIR = path.join(process.cwd(), "skills");

function titleCase(name: string): string {
  return name
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function extractDescription(block: string): string {
  const idx = block.search(/^description:/m);
  if (idx === -1) return "";
  const after = block.slice(idx + "description:".length);
  const lines = after.split(/\r?\n/);
  const parts: string[] = [lines[0].trim()];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^[a-zA-Z][\w-]*:/.test(line) || line.trim() === "") break;
    parts.push(line.trim());
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function parseFrontmatter(md: string): { name?: string; description?: string } {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const block = m[1];
  const nameMatch = block.match(/^name:\s*(.+)$/m);
  return {
    name: nameMatch ? nameMatch[1].trim() : undefined,
    description: extractDescription(block),
  };
}

export function listSkills(): SkillSummary[] {
  const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true }).filter((e) => e.isDirectory());
  const skills: SkillSummary[] = [];
  for (const entry of entries) {
    const file = path.join(SKILLS_DIR, entry.name, "SKILL.md");
    if (!fs.existsSync(file)) continue;
    const { name, description } = parseFrontmatter(fs.readFileSync(file, "utf-8"));
    if (!name) continue;
    skills.push({ name, title: titleCase(name), description: description ?? "" });
  }
  skills.sort((a, b) => a.title.localeCompare(b.title));
  return skills;
}

export function getSkill(name: string): SkillDetail | undefined {
  const file = path.join(SKILLS_DIR, name, "SKILL.md");
  if (!fs.existsSync(file)) return undefined;
  const raw = fs.readFileSync(file, "utf-8");
  const { description } = parseFrontmatter(raw);
  const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").trim();
  return {
    name,
    title: titleCase(name),
    description: description ?? "",
    body,
  };
}
