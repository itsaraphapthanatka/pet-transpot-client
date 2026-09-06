---
description: Run the PetGo QA team (api, e2e, mobile, web testers) in parallel and aggregate one report
argument-hint: [api|e2e|mobile|web ...]  (default: all four)
---
You are the QA lead. Run the tester subagents for: $ARGUMENTS (if empty, run all four: **api-tester**, **e2e-tester**, **mobile-tester**, **web-tester**).

Steps:
1. Launch every selected tester **in parallel** with the Agent tool (one message, multiple Agent calls), each with the prompt: "Run your full procedure now. No arguments. Return only your report." If a tester's subagent type is not available in this session, launch a `general-purpose` agent instead and tell it to `cat` the matching file under `.claude/agents/` and adopt everything below the frontmatter as its instructions.
2. Wait for all of them. Do not start fixing anything.
3. Verify the top 3 blocking findings yourself (read the file:line or re-run the request) before reporting; drop or downgrade anything you cannot reproduce.
4. Write one aggregated report in Thai:

```
# QA report — <date>

| ส่วน | ผล | Bug | Security | Warning |
|---|---|---|---|---|
| Backend API | <PASS/FAIL/BLOCKED> | N | N | N |
| End-to-end flow | ... | | | |
| Mobile apps | ... | | | |
| Web (admin + landing) | ... | | | |

## ต้องแก้ก่อน (blocking, ทุกส่วนรวมกัน เรียงตามความรุนแรง)
1. <ส่วน> — <finding พร้อม file:line / METHOD /path และวิธีแก้>

## Security
...

## ควรแก้ / Warning
...

## ยังไม่ได้ทดสอบ (และทำไม)
- <เช่น chat/WebSocket ไม่มี Redis, Stripe/SMS/push ไม่ยิงจริง, ไม่มี simulator>

## รายงานฉบับเต็มของแต่ละ tester
<แปะ report ของแต่ละตัวต่อกัน ไม่ตัดทอน>
```

Deduplicate findings that several testers reported (keep the most precise one and note who else saw it). Never present a subagent's unverified claim as confirmed.
