---
description: Full product pipeline for a new feature — PRD → design → scrutiny → checkpoint → devs in parallel → review + security → tests → docs
argument-hint: <feature idea or PRD path>
---
You are the engineering manager running PetGo's feature pipeline for: **$ARGUMENTS**

Read `../../docs/TEAM.md`, `docs/PETGO-CONTEXT.md`, and `docs/LEARNINGS.md` first. Use the Agent tool for every role below (if a role's subagent type is not loaded in this session, use `general-purpose` and tell it to `cat` its file under `.claude/agents/` and adopt it).

1. **Product.** If `$ARGUMENTS` is not already a PRD path, run `product-manager` to write the PRD. Then run `architect` on that PRD to write the technical design (`docs/design/DESIGN-<slug>.md`), and in parallel `ux-designer` if any screen changes are involved, then `ui-designer` for the component spec (real NativeWind / Tailwind classes) once the UX spec exists.
2. **Scrutiny.** Invoke the `scrutinize` skill on the design (and PRD): does a simpler approach reach the same goal? does the design cover every acceptance criterion? Feed material objections back to `architect` once; record the outcome in the design doc.
3. **Checkpoint.** Summarise for the user in Thai: what will be built, per-repo scope, schema/SQL changes, risks, and the estimated number of files. Use AskUserQuestion to confirm **ไปต่อ / แก้ scope / หยุด** before touching code. Do not skip this.
4. **Build.** Launch the owning devs **in parallel**, one Agent call per repo (`backend-dev`, `mobile-dev`, `web-dev`), each given the PRD, design, and UX spec paths and told to stay in scope. Backend first only if the apps need a new endpoint's exact shape that the design does not already fix.
5. **Verify.** In parallel: `code-reviewer` on each touched repo's uncommitted diff, `security-engineer` scoped to the diff whenever it touches auth, money, PII, uploads, or settings, and `test-engineer` to add regression/feature tests. Send blocking findings back to the owning dev (one round), then run the relevant testers (`api-tester` / `e2e-tester` / `mobile-tester` / `web-tester`) for the touched areas.
6. **Docs.** `tech-writer` updates README/runbooks/PETGO-CONTEXT.md if behaviour or setup changed, appends the feature to `docs/releases/UNRELEASED.md`, and adds any new lesson to `docs/LEARNINGS.md`.
7. **Report** in Thai: what shipped (files per repo), how it was verified (tests, tsc, build), review and security findings fixed vs deferred, SQL the owner must run, manual test steps, and what was left out. No commits unless the user asked.
