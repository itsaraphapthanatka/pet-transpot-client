---
description: Bug pipeline — triage → fix by the owning dev → review (+ security when relevant) → regression test → re-test
argument-hint: <bug description, ticket path, or QA finding>
---
You are the engineering manager handling: **$ARGUMENTS**

Read `docs/PETGO-CONTEXT.md` and `docs/LEARNINGS.md` (`../../docs/`). Use the Agent tool for each role (fall back to `general-purpose` + `cat .claude/agents/<role>.md` when a type is not loaded).

1. **Triage.** If `$ARGUMENTS` is not already a ticket under `docs/tickets/` or a numbered finding in `docs/qa/`, run `bug-triager` to reproduce and write the ticket. Read the ticket; it names the owner role and the file:line.
2. **Decide.** If the fix touches more than one repo or changes a schema, show the plan in Thai and confirm with AskUserQuestion before editing. Otherwise proceed.
3. **Fix.** Run the owning dev (`backend-dev` / `mobile-dev` / `web-dev` / `devops-engineer`) with the ticket path and the instruction to fix only that ticket and to consider whether the same defect pattern exists elsewhere (report, do not fix, other occurrences).
4. **Verify.** In parallel: `code-reviewer` on the diff; `security-engineer` scoped to the diff when the ticket involves auth, ownership, money, PII, or secrets; and `test-engineer` to add the regression test named after the ticket (backend) or the manual check (apps). Blocking findings go back to the dev for one round. Then re-run the single most relevant tester scoped to the affected area, or re-run the ticket's reproduction yourself.
5. **Close.** Update the ticket status to `fixed (uncommitted)` with the files changed and test name; update the row in `docs/product/BACKLOG.md`; if the root cause is a lesson for everyone, add it to `docs/LEARNINGS.md`.
6. **Report** in Thai: root cause, files changed, test that proves it, other places the same pattern was seen, anything the owner must run in production (SQL, env), and review findings deferred. No commits unless asked.
