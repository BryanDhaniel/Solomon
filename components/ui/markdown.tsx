import React from "react";

/* ═══════════════════════════════════════════════
   MARKDOWN RENDERER
   Clean, minimal — no heavy prose classes.
   ═══════════════════════════════════════════════ */
export function RenderMarkdown({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split("\n");
  const out: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    /* ── Code block ───────────────────────── */
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        code.push(lines[i]);
        i++;
      }
      i++;
      out.push(
        <div key={key++} className="my-4 rounded-lg overflow-hidden border border-border/40 bg-foreground/[0.03]">
          {lang && (
            <div className="px-4 py-1.5 text-[11px] text-muted-foreground font-mono border-b border-border/30 bg-foreground/[0.02]">
              {lang}
            </div>
          )}
          <pre className="px-4 py-3 overflow-x-auto">
            <code className="text-[13px] font-mono text-foreground/80 leading-relaxed whitespace-pre">
              {code.join("\n")}
            </code>
          </pre>
        </div>
      );
      continue;
    }

    /* ── Table ────────────────────────────── */
    if (line.includes("|") && line.trim().startsWith("|")) {
      const rows: string[] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim().startsWith("|")) {
        rows.push(lines[i]);
        i++;
      }
      const parsed = rows
        .filter((r) => !r.match(/^\|\s*[-:]+/))
        .map((r) => r.split("|").filter((c) => c.trim()).map((c) => c.trim()));

      if (parsed.length > 0) {
        out.push(
          <div key={key++} className="my-4 overflow-x-auto rounded-lg border border-border/40">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-foreground/[0.03]">
                  {parsed[0].map((c, ci) => (
                    <th key={ci} className="px-4 py-2.5 text-left font-semibold text-foreground border-b border-border/30">
                      <Inline text={c} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsed.slice(1).map((row, ri) => (
                  <tr key={ri} className="border-b border-border/15 last:border-0">
                    {row.map((c, ci) => (
                      <td key={ci} className="px-4 py-2.5 text-foreground/70">
                        <Inline text={c} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    /* ── Headings ─────────────────────────── */
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2].trim();
      const cls =
        level === 1
          ? "text-xl font-semibold text-foreground mt-6 mb-3 tracking-tight"
          : level === 2
          ? "text-base font-semibold text-foreground mt-5 mb-2"
          : "text-sm font-semibold text-foreground mt-4 mb-1.5";
      out.push(
        <p key={key++} className={cls}>
          <Inline text={text} />
        </p>
      );
      i++;
      continue;
    }

    /* ── Blockquote ───────────────────────── */
    if (line.startsWith(">")) {
      const quotes: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        quotes.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      out.push(
        <blockquote key={key++} className="border-l-2 border-ink-wash/40 pl-3 my-3 text-muted-foreground">
          {quotes.map((q, qi) => (
            <p key={qi} className="mb-1">
              <Inline text={q} />
            </p>
          ))}
        </blockquote>
      );
      continue;
    }

    /* ── Bold heading line ─────────────────── */
    if (line.startsWith("**") && line.endsWith("**") && !line.slice(2, -2).includes("**")) {
      out.push(
        <p key={key++} className="font-semibold text-foreground mt-5 mb-1.5">
          {line.slice(2, -2)}
        </p>
      );
      i++;
      continue;
    }

    /* ── Numbered list ────────────────────── */
    if (line.match(/^\d+\.\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      out.push(
        <ol key={key++} className="my-2 ml-5 flex flex-col gap-2 list-decimal marker:text-muted-foreground/50">
          {items.map((item, li) => (
            <li key={li} className="text-[15px] text-foreground/85 leading-[1.7] pl-1">
              <Inline text={item} />
            </li>
          ))}
        </ol>
      );
      continue;
    }

    /* ── Bullet list ──────────────────────── */
    if (line.match(/^[-*]\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*]\s/)) {
        items.push(lines[i].replace(/^[-*]\s/, ""));
        i++;
      }
      out.push(
        <ul key={key++} className="my-2 ml-5 flex flex-col gap-2 list-disc marker:text-muted-foreground/40">
          {items.map((item, li) => (
            <li key={li} className="text-[15px] text-foreground/85 leading-[1.7] pl-1">
              <Inline text={item} />
            </li>
          ))}
        </ul>
      );
      continue;
    }

    /* ── Blank line ────────────────────────── */
    if (!line.trim()) {
      i++;
      continue;
    }

    /* ── Paragraph ─────────────────────────── */
    out.push(
      <p key={key++} className="mb-1">
        <Inline text={line} />
      </p>
    );
    i++;
  }

  return <>{out}</>;
}

/* ── Inline: bold + code ──────────────────── */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**"))
          return <strong key={i} className="font-semibold text-foreground">{p.slice(2, -2)}</strong>;
        if (p.startsWith("`") && p.endsWith("`"))
          return (
            <code key={i} className="px-1.5 py-0.5 rounded-md bg-foreground/[0.05] text-[13px] font-mono text-foreground/80">
              {p.slice(1, -1)}
            </code>
          );
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}
