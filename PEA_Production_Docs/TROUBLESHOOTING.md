# Troubleshooting

## Web App / API

### CORS

Frontend ใช้ `Content-Type: text/plain` กับ POST ไป GAS — อย่าเปลี่ยนเป็น `application/json` โดยไม่ทดสอบ

### Empty Data

- ตรวจ `SHEET_ID` ใน `Code.gs`
- ตรวจชื่อชีต `WBS`, `LOG`, `CONFIG`

### Upload Failure

- ตรวจ `DRIVE_FOLDER_ID` และสิทธิ์ Drive
- Execute as: **Me** ใน Web App deploy

---

## LINE Bot

### Webhook Verify = 401 / Failed

1. Deploy **New version** ของ Web App
2. Webhook URL = `https://script.google.com/macros/s/DEPLOY_ID/exec` (**ไม่มี** `?bot=` หรือ `?key=`)
3. Who has access = **Anyone**

### พิมพ์ `สรุปสถานะ` แล้วไม่ตอบ

- ตรวจ Webhook เปิดอยู่ + Verify Success
- ดูชีต **BOT_LOG** มีแถว `LINE | incoming`
- ตรวจ Channel Access Token ใน Script Properties

### Push รายวันไม่มา LINE (แต่ Telegram มา)

- เปิดชีต **NOTIFY** → แถว LINE ต้อง `DailyPush=YES` + `Active=YES`
- User ต้อง **add friend** bot แล้ว (ไม่ block)
- ลบแถว `U_TEST_USER` (ID ทดสอบปลอม)
- Run `testSendDailyPush()` → ดู Execution log ว่า LINE API error อะไร

### โควต้าข้อความ LINE หมด

- Push + Reply + ทดสอบ **นับรวม** โควต้า OA รายเดือน
- ดูยอดใน [LINE Official Account Manager](https://manager.line.biz/)

---

## Telegram Bot

### ไม่ตอบ `/summary` เลย

1. Run `stopTelegramPolling()` → **รอ 1 นาที**
2. Run `enableTelegramPolling()`
3. ตรวจ Triggers — ควรมี **pollTelegramUpdatesLoop_** แค่ **1 ตัว**
4. ดู **BOT_LOG** — ต้องมีแถว `poll` / `message` หลังพิมพ์

### Error: Conflict getUpdates

- มี polling 2 ที่พร้อมกัน (trigger ซ้ำ หรือ Run `enableTelegramPolling()` ซ้อนขณะ loop เก่ายังรัน)
- แก้: `stopTelegramPolling()` → รอ 1 นาที → ลบ trigger ซ้ำ → `enableTelegramPolling()`

### ตอบช้า ~30–60 วินาที

- ปกติถ้าใช้ polling แบบเก่า (ทุก 1 นาที)
- โค้ดล่าสุด poll ทุก **5 วินาที** ใน loop — Deploy + `enableTelegramPolling()` ใหม่

### กลุ่ม: `/summary` ได้ แต่ `สรุปสถานะ` ไม่ได้

- **Group Privacy Mode** ของ Telegram — ปิดที่ BotFather หรือใช้ `/summary` ในกลุ่ม

### Webhook vs Polling

- ระบบใช้ **polling** เป็นหลัก — อย่า Run `enableTelegramWebhook()` พร้อม polling
- `getUpdates` กับ webhook **ใช้พร้อมกันไม่ได้**

---

## Daily Push

### ไม่ส่งเลย

- NOTIFY ไม่มีแถว `DailyPush=YES` + `Active=YES`
- Run `installDailyPushTrigger(8)` อีกครั้ง
- ตรวจ Triggers มี `sendDailyStatusPush`

### เปลี่ยนเวลา push

```javascript
installDailyPushTrigger(7);  // 07:00 น.
```

อย่าแก้ trigger ใน UI แล้วลืม — Run ฟังก์ชันนี้จะ sync ให้ถูก

---

## GAS Quota

| รายการ | โดยประมาณ (บัญชีฟรี) |
|--------|---------------------|
| เวลารัน script / วัน | ~90 นาที |
| UrlFetch / วัน | ~20,000 |
| Telegram polling | ~1,440 trigger runs / วัน |

ถ้า quota หมด — ลด polling หรือ upgrade Google Workspace

---

## Log ที่ใช้ debug

| ชีต / Log | ดูอะไร |
|-----------|---------|
| **BOT_LOG** | webhook / poll / error |
| **Execution log** (Apps Script) | ผล `testSendDailyPush()`, API error |
| **NOTIFY** | target ที่เปิด push |
