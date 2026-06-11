# Bot Setup — LINE & Telegram

คู่มือตั้งค่าและใช้งาน Bot แจ้งสรุปสถานะงาน PEA Tracking  
ไฟล์หลัก: `BotNotify.gs` (เรียกจาก `Code.gs` → `doPost`)

---

## ภาพรวม

| แพลตฟอร์ม | รับข้อความเข้า | ส่ง Push ออก | ความเร็วตอบ |
|-----------|----------------|--------------|-------------|
| **LINE** | Webhook → `doPost` | Push API | ทันที |
| **Telegram** | Polling (getUpdates) | sendMessage API | ~5–10 วินาที |

> Telegram ใช้ **polling** แทน webhook เพราะ GAS + Telegram webhook มักไม่เสถียร  
> LINE ใช้ webhook URL ลงท้าย `/exec` โดยตรง (ไม่ต้องใส่ `?key=`)

---

## ขั้นตอนติดตั้งครั้งแรก

### 1. Copy โค้ด + Deploy GAS

1. วาง `BotNotify.gs` และ `Code.gs` ใน Apps Script Editor
2. **Deploy → Manage deployments → New version**
3. ตั้งค่า Web App: **Execute as: Me** | **Who has access: Anyone**

### 2. บันทึก Secrets — Run `setupBotOnce()`

แก้ค่าใน `setupBotOnce()` แล้ว Run:

```javascript
configureBotSecrets({
  lineChannelAccessToken: '...',
  lineChannelSecret: '...',
  telegramBotToken: '...',
  webAppUrl: 'https://wbs-tracking-pea-npn.vercel.app',
  webhookUrl: 'https://script.google.com/macros/s/DEPLOY_ID/exec',
  botWebhookSecret: '...'  // เก็บไว้ ไม่บังคับใส่ใน URL แล้ว
});
```

Secrets เก็บใน **Script Properties** (ไม่ commit ลง git)

### 3. ตั้ง Trigger + Telegram — Run `setupBotStep2()`

```javascript
// ภายใน setupBotStep2():
installDailyPushTrigger(8);   // push รายวัน 08:00 น.
enableTelegramPolling();      // เปิด polling Telegram
```

### 4. ตั้ง LINE Webhook

1. Run `showBotWebhookUrls()` → copy `lineWebhookUrl`
2. ไป [LINE Developers Console](https://developers.line.biz/) → Messaging API → Webhook URL
3. วาง URL ลงท้าย **`/exec` เท่านั้น** (ไม่มี query string)
4. เปิด **Use webhook** → กด **Verify** (ต้อง Success)

### 5. ตั้งชีต NOTIFY

ดูรายละเอียดคอลัมน์ใน [DATA_SCHEMA.md](./DATA_SCHEMA.md#sheet-notify)

| Label | Platform | TargetId | DailyPush | Active | Note |
|-------|----------|----------|-----------|--------|------|
| ทีม NPN | TELEGRAM | -5122822245 | YES | YES | group |
| ชื่อคน | LINE | Uc91e86c... | YES | YES | |

- **TargetId ลงทะเบียนอัตโนมัติ** เมื่อ user ทัก bot
- ตั้ง `DailyPush=YES` + `Active=YES` เฉพาะคนที่ต้องการรับ push รายวัน

### 6. ทดสอบ

| ฟังก์ชัน | ทดสอบอะไร |
|----------|-----------|
| `testSendDailyPush()` | Push รายวัน ไปทุกแถวที่ DailyPush=YES |
| พิมพ์ `สรุปสถานะ` ใน LINE | Flex Message + Quick Reply |
| พิมพ์ `/summary` ใน Telegram | สรุป HTML + ปุ่ม inline |

---

## คำสั่งที่ User ใช้ได้

### LINE (แชทส่วนตัว)

| คำสั่ง | ผลลัพธ์ |
|--------|---------|
| `สรุปสถานะ` | Flex Message สรุปขั้น 1–10 |
| `summary` | เหมือนกัน |
| Quick Reply | ปุ่ม "สรุปสถานะ" |

### Telegram

| ที่ | คำสั่งที่ใช้ได้ |
|----|----------------|
| **แชทส่วนตัว** | `/summary`, `สรุปสถานะ`, `สรุปสถานะงาน` |
| **กลุ่ม** | `/summary` หรือกดปุ่ม **📊 สรุปสถานะ** เท่านั้น* |

\* ในกลุ่ม Telegram มี **Group Privacy Mode** — bot เห็นแค่ข้อความที่ขึ้นต้นด้วย `/`  
ถ้าอยากพิมพ์ไทยในกลุ่ม: BotFather → Bot Settings → Group Privacy → **Turn off**

---

## Push รายวัน

### ตั้งเวลา

```javascript
installDailyPushTrigger(8);   // 08:00 น.
installDailyPushTrigger(7);   // 07:00 น.
```

Timezone: `Asia/Bangkok` — ฟังก์ชันนี้ลบ trigger เก่าแล้วสร้างใหม่อัตโนมัติ  
**ไม่แนะนำ** แก้เวลาใน Triggers UI โดยตรง (Run `installDailyPushTrigger` ใหม่ดีกว่า)

### ทดสอบส่งทันที

```javascript
testSendDailyPush();  // เรียก sendDailyStatusPush()
```

### เงื่อนไขการส่ง

ส่งเฉพาะแถวใน NOTIFY ที่ **`DailyPush=YES`** และ **`Active=YES`**

| Platform | TargetId ตัวอย่าง |
|----------|-------------------|
| LINE | `Uc91e86c73e1735b28aca51f06bddea88` |
| TELEGRAM (กลุ่ม) | `-5122822245` |
| TELEGRAM (ส่วนตัว) | `7792601755` |

---

## ฟังก์ชัน Admin (Apps Script)

| ฟังก์ชัน | หน้าที่ |
|----------|---------|
| `setupBotOnce()` | บันทึก token / URL ครั้งแรก |
| `setupBotStep2()` | ตั้ง daily trigger + Telegram polling |
| `enableTelegramPolling()` | เปิด/รีเซ็ต Telegram polling |
| `stopTelegramPolling()` | หยุด polling (รอก่อน enable ใหม่) |
| `repairAllBots()` | LINE URL info + enable Telegram polling |
| `showBotWebhookUrls()` | ดู URL สำหรับ LINE Developers |
| `showDailyPushSetupGuide()` | คู่มือ + รายชื่อ target ปัจจุบัน |
| `diagnoseBotWebhook()` | ตรวจ webhook / ping |
| `pollTelegramNow()` | ดึงข้อความ Telegram ทันที (ไม่รอ trigger) |

---

## โควต้า / ค่าใช้จ่าย

### LINE Messaging API

- **Push** และ **Reply** นับรวมโควต้าข้อความรายเดือนของ LINE OA (เช่น ~300–500 ข้อความ/เดือน ตามแพ็ก)
- การทดสอบ (`testSendDailyPush`, `สรุปสถานะ`) **นับด้วย**
- Flex 2 ชิ้น (flex + hint) = 2 ข้อความต่อครั้ง

### Telegram Bot API

- **ฟรี** — ไม่มีโควต้า 300 ข้อความ/เดือน

### Google Apps Script

- ไม่ใช่ 300/เดือน — จำกัด **เวลารัน** (~90 นาที/วัน) และ **UrlFetch** (~20,000/วัน)
- Telegram polling (trigger ทุก 1 นาที) ใช้เวลารัน GAS มากที่สุด

---

## Troubleshooting สั้นๆ

| อาการ | แก้ |
|-------|-----|
| LINE Verify 401 | Deploy ใหม่ + URL ลงท้าย `/exec` ไม่มี `?key=` |
| Telegram ไม่ตอบ | Run `stopTelegramPolling()` → รอ 1 นาที → `enableTelegramPolling()` |
| Telegram Conflict getUpdates | มี polling ซ้ำ — ลบ trigger ซ้ำใน Triggers UI |
| Push มา Telegram แต่ไม่มา LINE | ตั้ง `DailyPush=YES` + `Active=YES` ใน NOTIFY แถว LINE |
| Telegram ช้า ~30 วิ | ปกติของ polling — อัปเดตโค้ดล่าสุดใช้ interval 5 วิ |
| ไม่มีแถว NOTIFY ใหม่ | webhook/polling ยังไม่ทำงาน — ดูชีต BOT_LOG |

รายละเอียดเพิ่ม: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## ชีต Log

### BOT_LOG

บันทึก webhook / polling อัตโนมัติ

| คอลัมน์ | ความหมาย |
|---------|----------|
| Timestamp | เวลา |
| Platform | LINE / TELEGRAM |
| Status | incoming, message, poll, error |
| Detail | chatId, error message |
| Snippet | ข้อความ / payload ย่อ |

---

## ไฟล์ที่เกี่ยวข้อง

| ไฟล์ | บทบาท |
|------|--------|
| `BotNotify.gs` | Bot logic ทั้งหมด |
| `Code.gs` | `doPost` route → bot หรือ API |
| `NOTIFY` sheet | รายชื่อ push target |
| `BOT_LOG` sheet | log การทำงาน bot |
