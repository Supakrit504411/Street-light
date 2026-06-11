# Roadmap

## Phase 1 — Current (Done)

- [x] Workflow tracking 10 steps
- [x] Dashboard KPI + list filters
- [x] File upload per step
- [x] Audit LOG
- [x] LINE bot — สรุปสถานะ (Flex) + push รายวัน
- [x] Telegram bot — `/summary` + push รายวัน (polling)

## Phase 2 — Hardening

- [ ] API keys / auth สำหรับ public endpoint
- [ ] RBAC จาก CONFIG sheet
- [ ] ลด GAS quota จาก Telegram polling (ลอง webhook ใหม่หรือ external relay)

## Phase 3 — Enhancements

- [ ] แจ้งเตือนเมื่อ step เปลี่ยน (event-driven push)
- [ ] Dashboard analytics
- [ ] Export / report

## Bot Improvements (Backlog)

- [ ] ปิด Group Privacy อัตโนมัติ (ไม่ได้ — ต้องทำใน BotFather)
- [ ] ลด latency Telegram (< 5 วิ) ด้วย webhook relay นอก GAS
- [ ] รวมคำสั่ง LINE/Telegram ในเมนูช่วยเหลือเดียวกัน
