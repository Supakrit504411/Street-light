# System Architecture

## Overview

```
Browser (Vercel)
    │ POST action=...
    ▼
GAS Web App (Code.gs → doPost)
    ├── App API → getBootstrap, login, updateStep, uploadFile ...
    └── Bot Router (BotNotify.gs → handleBotWebhook_)
            ├── LINE webhook (POST, body.events[])
            └── Telegram polling (getUpdates ทุก ~5 วิ ใน trigger loop)
                    │
                    ▼
            Google Sheets (WBS, LOG, CONFIG, NOTIFY, BOT_LOG)
            Google Drive (ไฟล์แนบ)
                    │
                    ▼
            Outbound: LINE Push/Reply API, Telegram sendMessage API
```

## Frontend Modules (`public/js/`)

| Module | หน้าที่ |
|--------|--------|
| `api.js` | เรียก GAS API |
| `state.js` | State, filters, sort |
| `list.js` | หน้ารายการ + filter |
| `kpi.js` | Dashboard |
| `sheet.js` | Modal อัปเดต step |
| `ui.js` | UI helpers, table sort |
| `form.js` | Form handling |

Config: `public/config.js` → `GAS_URL`

## Backend (`Code.gs`)

- `doGet` → serve `index.html` (ถ้า deploy จาก GAS)
- `doPost` → แยก bot vs app โดย `detectBotPlatform_(body)`
  - `body.events[]` → LINE
  - `body.update_id` → Telegram webhook (ถ้าเปิด)
  - `body.action` → Web app API

## Bot Layer (`BotNotify.gs`)

| ส่วน | รายละเอียด |
|------|------------|
| **LINE inbound** | Webhook → `handleLineWebhook_` → Flex + Quick Reply |
| **Telegram inbound** | `pollTelegramUpdatesLoop_` → `processTelegramUpdate_` |
| **Summary logic** | `getStatusSummary_()` — นับงานต่อขั้น 1–10 |
| **Daily push** | `sendDailyStatusPush()` → NOTIFY targets |
| **Secrets** | Script Properties via `configureBotSecrets()` |

## ทำไม Telegram ใช้ Polling

GAS Web App redirect (302) ทำให้ Telegram webhook ไม่เสถียร  
LINE webhook ใช้ URL `/exec` ได้ปกติ

Polling: trigger ทุก 1 นาที → loop ดึง `getUpdates` ทุก 5 วิ × 11 รอบ

## Timezone

`Asia/Bangkok` — daily push, log timestamps, summary `generatedAt`
