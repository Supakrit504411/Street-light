# Deployment Guide

## Backend (Google Apps Script)

### ไฟล์ที่ต้องมีในโปรเจกต์ GAS

| ไฟล์ | หน้าที่ |
|------|--------|
| `Code.gs` | Web App API, `doGet`, `doPost` |
| `BotNotify.gs` | LINE / Telegram bot |
| `index.html` | (ถ้า serve UI จาก GAS) |

### Deploy Web App

1. Apps Script → **Deploy → Manage deployments → New deployment**
2. Type: **Web app**
3. **Execute as:** Me
4. **Who has access:** Anyone
5. Copy URL ลงท้าย `/exec` → ใส่ใน `public/config.js` และ `configureBotSecrets({ webhookUrl })`

### หลัง Deploy ทุกครั้งที่แก้โค้ด

1. **New version** (ไม่ใช่แค่ Save)
2. LINE: ตรวจ Webhook Verify ใน LINE Developers (URL เดิม `/exec`)
3. Telegram: Run `enableTelegramPolling()` ถ้าแก้ `BotNotify.gs`

---

## Frontend (Vercel)

1. แก้ `public/config.js`:

```javascript
const GAS_URL = 'https://script.google.com/macros/s/DEPLOY_ID/exec';
```

2. Push to Git → Vercel auto-deploy
3. ตรวจ `webAppUrl` ใน Script Properties ให้ตรง URL Vercel (ใช้ในลิงก์ bot)

---

## Bot Setup (ครั้งแรก)

ดูขั้นตอนเต็มใน [BOT_SETUP.md](./BOT_SETUP.md)

ลำดับย่อ:

```
setupBotOnce()        → บันทึก token
setupBotStep2()       → daily trigger + Telegram polling
LINE Developers       → Webhook URL = .../exec
NOTIFY sheet          → DailyPush=YES สำหรับผู้รับ push
testSendDailyPush()   → ทดสอบ
```

---

## Validation Checklist

### Web App

- [ ] Login สำเร็จ
- [ ] Bootstrap โหลดข้อมูล WBS
- [ ] อัปเดต step + upload ไฟล์
- [ ] LOG sheet มี audit record

### LINE Bot

- [ ] Webhook Verify = Success
- [ ] พิมพ์ `สรุปสถานะ` → ได้ Flex Message
- [ ] `testSendDailyPush()` → LINE user ที่ DailyPush=YES ได้รับ

### Telegram Bot

- [ ] `enableTelegramPolling()` ไม่ error
- [ ] พิมพ์ `/summary` → ได้สรุปภายใน ~10 วินาที
- [ ] `testSendDailyPush()` → Telegram target ที่ DailyPush=YES ได้รับ

---

## Scheduled Triggers

| Trigger | ฟังก์ชัน | ค่าเริ่มต้น |
|---------|----------|------------|
| รายวัน | `sendDailyStatusPush` | 08:00 (`installDailyPushTrigger(8)`) |
| ทุก 1 นาที | `pollTelegramUpdatesLoop_` | สร้างโดย `enableTelegramPolling()` |

ตรวจ Triggers: Apps Script → **Triggers** (ไอคอนนาฬิกา)
