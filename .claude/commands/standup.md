---
description: Cross-repo status of PetGo in ten lines
---
Produce a standup in Thai (≤ 12 lines) without launching subagents:

1. For each of the five repos in `docs/PETGO-CONTEXT.md`, run `git -C <repo> status --porcelain | wc -l` and `git -C <repo> log -3 --format='%h %ad %s' --date=short` (all in one Bash call).
2. Read `docs/product/BACKLOG.md` (top 5 open P0 rows), `ls docs/tickets` (open count), the newest file in `docs/qa/` (date + verdict line), and `docs/releases/UNRELEASED.md` if it exists.
3. Report: per repo one line (uncommitted files, last commit date + subject); then "งานเร่งด่วน" (top P0), "ตั๋วเปิด", "QA ล่าสุด", and one suggested next command (`/fix …`, `/feature …`, `/test-all`).
