# PEA Tracking System

Production-ready overview for GAS + Google Sheets + Vercel frontend.

## Stack

- **Frontend:** HTML / CSS / JavaScript (`public/`)
- **Backend:** Google Apps Script (`Code.gs`, `BotNotify.gs`)
- **Database:** Google Sheets (WBS, LOG, CONFIG, NOTIFY, BOT_LOG)
- **Storage:** Google Drive
- **Deploy:** Vercel (frontend) + GAS Web App `/exec` (backend)

## Core Features

- Job tracking & workflow status (10 steps)
- File uploads per step
- Audit logs
- Role-based access (CONFIG sheet)
- Dashboard KPI & list filters
- **LINE Bot** — สรุปสถานะ (Flex) + Push รายวัน
- **Telegram Bot** — `/summary` + Push รายวัน (polling)

## Quick Start

1. Deploy GAS Web App (`Code.gs` + `BotNotify.gs`)
2. Configure `public/config.js` → `GAS_URL`
3. Deploy frontend to Vercel
4. Verify bootstrap API (login + load data)
5. *(Optional)* ตั้ง Bot — ดู [BOT_SETUP.md](./BOT_SETUP.md)

## Documentation Index

| ไฟล์ | เนื้อหา |
|------|---------|
| [BOT_SETUP.md](./BOT_SETUP.md) | ตั้งค่า LINE / Telegram bot, push รายวัน |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Deploy backend + frontend |
| [DATA_SCHEMA.md](./DATA_SCHEMA.md) | โครงสร้างชีต |
| [API_REFERENCE.md](./API_REFERENCE.md) | API actions + bot endpoints |
| [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) | สถาปัตยกรรมระบบ |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | แก้ปัญหา |
| [AI_HANDOVER.md](./AI_HANDOVER.md) | สรุปสำหรับ AI / developer ใหม่ |
| [PROJECT_RULES.md](./PROJECT_RULES.md) | กฎการพัฒนา |
| [ROADMAP.md](./ROADMAP.md) | แผนพัฒนา |
