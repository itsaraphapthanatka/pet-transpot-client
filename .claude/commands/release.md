---
description: Prepare a release — devops checklist + release notes, no deploy
argument-hint: [backend|admin|customer|driver|landing|all]
---
Prepare a release for: $ARGUMENTS (empty means every repo with commits since its last release note in `docs/releases/`).

Run **in parallel**: `devops-engineer` to produce/update `docs/releases/CHECKLIST.md` and the deploy runbook for the target (migrations/SQL, env vars, native rebuild, smoke tests, rollback), and `tech-writer` to write `docs/releases/<YYYY-MM-DD>-<repo>.md` from git history. (Fall back to `general-purpose` + `cat .claude/agents/<role>.md` when a type is not loaded.)

Then report in Thai: what is in the release, the ordered steps the owner runs, and the blockers from the latest QA report that are still open. Never deploy, tag, or push.
