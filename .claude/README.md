# ทีม agent ของ PetGo

โฟลเดอร์นี้คือทีมพัฒนา 17 คน + คำสั่ง 10 ตัว ที่ใช้กับ Claude Code
เอกสารกลาง (context, TEAM, LEARNINGS, PRD, ADR, QA) อยู่คนละ repo:
https://github.com/itsaraphapthanatka/petgo-docs

## ต้องวางโฟลเดอร์แบบนี้เท่านั้น

path ในไฟล์ agent เป็น **relative** ทั้งหมด ถ้าวางผิดโครงสร้าง agent จะหา repo อื่นและ docs ไม่เจอ

```
pet_transport/
├── docs/                                  ← clone petgo-docs มาไว้ตรงนี้
├── pet_transport_fastapi_bakend/
├── pet_transport_admin/
├── happy-hound-rides/
└── pet_transport_fastapi_frontend/
    ├── pet-transpot-client/               ← repo นี้ (.claude อยู่ที่นี่)
    └── petgo-driver/
```

## มีอะไรบ้าง

- `agents/` — 17 role (pm, architect, ux, ui, dev 3 ฝั่ง, tester 5, security, devops, tech-writer, bug-triager)
- `commands/` — `/team` `/feature` `/fix` `/review` `/test-all` `/prd` `/adr` `/security-audit` `/release` `/standup`
- `agent-team.json` — config ของ skill `agent-team` ใช้ตอน render/upgrade ทีมใหม่

## แก้ทีม

แก้ไฟล์ `agents/*.md` ตรง ๆ ได้เลย (ตอนนี้ hand-tune ไว้แล้ว ถ้า render ทับจะหาย)
skill กลางที่สร้างทีมแบบนี้ให้โปรเจกต์อื่น: https://github.com/itsaraphapthanatka/claude-agent-team

ไม่ commit: `settings.local.json` (path เฉพาะเครื่อง) และ `agent-memory/` (โน้ตส่วนตัวของ agent — บทเรียนที่ต้องแชร์ให้เขียนลง `docs/LEARNINGS.md` แทน)
