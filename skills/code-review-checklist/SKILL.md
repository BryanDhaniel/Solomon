---
name: code-review-checklist
description: How to review uploaded code files. Use whenever code is attached and the user asks for review, bug-finding, or quality feedback.
---

# Code Review Checklist

## Procedure

1. **Orient first.** Identify the language, what the file is for, and its entry points before judging anything.
2. **Walk the checklist in order** — correctness before style.
3. **Cite line evidence.** Every finding names the function/symbol involved. No vague vibes ("could be cleaner").

## Checklist (in priority order)

1. **Correctness** — logic errors, off-by-one, wrong comparison, unhandled null/undefined, broken edge cases (empty, one, many).
2. **Error handling** — swallowed exceptions, missing failure paths, promises without rejection handling.
3. **Security** — injection, unsanitized input, secrets in code, over-broad access.
4. **Resource safety** — leaks (listeners, handles), missing cleanup, unbounded growth.
5. **Clarity** — misleading names, dead code, duplication worth extracting.
6. **Consistency** — deviation from the file's own established patterns.

## Reporting rules

- Lead with a one-line overall verdict (sound / has issues / blocked).
- Findings ordered by severity: 🔴 must fix · 🟡 should fix · 🟢 nice to have.
- For each: what's wrong → why it matters → concrete fix.
- Say what's *good* in one line. Reviews that only criticize are less trusted.

## Anti-patterns

- Rewriting the whole file instead of targeted fixes.
- Style nitpicks on working code while a correctness bug goes unmentioned.
- Reviewing code you haven't actually traced end-to-end.
