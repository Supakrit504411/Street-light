# Data Schema

## WBS Sheet

| คอลัมน์ | เนื้อหา |
|---------|---------|
| 1–14 | Detail fields (WBS, PEA NO, ทีม, สถานะ ฯลฯ) |
| 15–24 | Workflow statuses (YES/NO ต่อขั้น) |
| 25 (Y) | `updated_at` |
| 26 (Z) | Transformer (PEA/CUS) |
| 27–36 | File references ต่อขั้น |
| 37 (AK) | Lat/Long |

## LOG Sheet

Audit trail ทุกการเปลี่ยนแปลง workflow

| ฟิลด์หลัก | ความหมาย |
|-----------|----------|
| jobId | อ้างอิง WBS |
| step | ขั้นที่แก้ |
| action | YES / NO / note |
| user | ผู้แก้ |
| timestamp | เวลา |

## CONFIG Sheet

User permissions และการตั้งค่าระบบ

---

## Sheet: NOTIFY

รายชื่อผู้รับ **Push รายวัน** และลงทะเบียน bot อัตโนมัติ

| คอลัมน์ | ประเภท | คำอธิบาย |
|---------|--------|----------|
| **Label** | text | ชื่อเรียก เช่น `WBS Tracking - PEA NPN` |
| **Platform** | `LINE` / `TELEGRAM` | แพลตฟอร์ม |
| **TargetId** | text | ID ปลายทาง (ดูด้านล่าง) |
| **DailyPush** | `YES` / `NO` | รับ push รายวัน |
| **Active** | `YES` / `NO` | เปิดใช้งาน |
| **Note** | text | หมายเหตุ |

### TargetId ตาม Platform

| Platform | รูปแบบ | ตัวอย่าง | ที่มา |
|----------|--------|----------|-------|
| LINE | `U` + hex | `Uc91e86c73e1735b28aca51f06bddea88` | ลงทะเบียนเมื่อ user ทัก bot |
| TELEGRAM (กลุ่ม) | เลขติดลบ | `-5122822245` | ใส่เอง หรือ auto เมื่อ bot ในกลุ่ม |
| TELEGRAM (ส่วนตัว) | เลขบวก | `7792601755` | ลงทะเบียนเมื่อ user ทัก bot |

### เงื่อนไข Push รายวัน

ส่งเมื่อ **`DailyPush=YES`** และ **`Active=YES`** เท่านั้น  
ฟังก์ชัน: `sendDailyStatusPush()` / trigger รายวัน

---

## Sheet: BOT_LOG

Log การทำงาน bot (สร้างอัตโนมัติ)

| คอลัมน์ | ความหมาย |
|---------|----------|
| Timestamp | `dd/MM/yyyy HH:mm:ss` (Asia/Bangkok) |
| Platform | `LINE` / `TELEGRAM` |
| Status | `incoming`, `message`, `poll`, `setWebhook`, `error` |
| Detail | chatId, error, ฯลฯ |
| Snippet | payload / ข้อความย่อ |

---

## Script Properties (Bot)

เก็บใน Apps Script → Project Settings → Script properties

| Key | ความหมาย |
|-----|----------|
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Messaging API |
| `LINE_CHANNEL_SECRET` | LINE channel secret |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token |
| `WEB_APP_URL` | URL frontend Vercel |
| `WEBHOOK_URL` | GAS deploy URL (`/exec`) |
| `BOT_WEBHOOK_SECRET` | (optional) legacy secret |
| `TELEGRAM_MODE` | `polling` / `off` / `webhook` |
| `TELEGRAM_UPDATE_OFFSET` | offset สำหรับ getUpdates |
