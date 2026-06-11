# API Reference

## Web App API (POST JSON → `doPost`)

Base URL: `https://script.google.com/macros/s/DEPLOY_ID/exec`  
Content-Type: `text/plain` (frontend)

| action | คำอธิบาย |
|--------|----------|
| `getBootstrap` | โหลดข้อมูลเริ่มต้น |
| `login` | `{ username, password }` |
| `updateStep` | `{ payload: { jobId, stepKey, value, note, ... } }` |
| `updateTransformer` | `{ jobId, transformer, auth }` |
| `createJob` | `{ payload: { wbs, transformer, auth } }` — เพิ่มแฟ้มงาน col A + Z |
| `getLog` | `{ jobId }` |
| `uploadFile` | `{ base64Data, fileName, mimeType, subFolder }` |

Response:

```json
{ "success": true, "data": { ... } }
{ "success": false, "error": "message" }
```

---

## Bot Endpoints

### LINE Webhook

```
POST https://script.google.com/macros/s/DEPLOY_ID/exec
Content-Type: application/json
Body: { "events": [ ... ] }
```

- ตั้ง URL ใน LINE Developers (ไม่มี query params)
- Router: `detectBotPlatform_` → `handleLineWebhook_`
- คำสั่ง: `สรุปสถานะ`, `summary` → Flex Message

### Telegram

**ไม่ใช้ webhook ใน production** — ใช้ polling:

```
GET https://api.telegram.org/bot{TOKEN}/getUpdates
```

- Handler: `pollTelegramUpdatesLoop_` → `processTelegramUpdate_`
- คำสั่ง: `/summary`, `สรุปสถานะ`, `สรุปสถานะงาน`
- กลุ่ม: `/summary` เท่านั้น (Privacy Mode)

---

## Scheduled Functions

| ฟังก์ชัน | Trigger | คำอธิบาย |
|----------|---------|----------|
| `sendDailyStatusPush` | รายวัน (default 08:00) | Push สรุปไป NOTIFY targets |
| `pollTelegramUpdatesLoop_` | ทุก 1 นาที | ดึง Telegram messages |

ตั้งด้วย:

```javascript
installDailyPushTrigger(8);
enableTelegramPolling();
```

---

## Admin / Test Functions

| ฟังก์ชัน | คำอธิบาย |
|----------|----------|
| `testSendDailyPush()` | เรียก `sendDailyStatusPush()` ทันที |
| `showDailyPushSetupGuide()` | คู่มือ + รายชื่อ targets |
| `showBotWebhookUrls()` | URL สำหรับ LINE webhook |
| `diagnoseBotWebhook()` | ตรวจสอบ webhook/ping |
| `pollTelegramNow()` | ดึง Telegram ทันที |

---

## Summary Data Shape

`getStatusSummary_()` returns:

```javascript
{
  totalJobs: number,
  completeJobs: number,
  steps: [{ num, key, label, count }],
  lastUpdatedText: string,
  generatedAt: string
}
```
