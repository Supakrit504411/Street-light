# AI Handover

## Project Purpose

PEA workflow tracking — ติดตามสถานะงาน WBS 10 ขั้น ผ่านเว็บ + แจ้งสรุปผ่าน LINE / Telegram bot

## Key Files

| ไฟล์ | บทบาท |
|------|--------|
| `Code.gs` | Backend API, doGet/doPost, STEP_CONFIG |
| `BotNotify.gs` | LINE/Telegram bot, push, NOTIFY sheet |
| `public/js/*` | Frontend modules |
| `public/config.js` | GAS_URL endpoint |

## Important Constants (Code.gs)

- `SHEET_ID` — Google Spreadsheet ID
- `SHEET_NAME` = `WBS`
- `LOG_SHEET_NAME` = `LOG`
- `CONFIG_SHEET_NAME` = `CONFIG`
- `DRIVE_FOLDER_ID` — upload folder
- `TIMEZONE` = `Asia/Bangkok`

## Bot Constants (BotNotify.gs)

- `NOTIFY_SHEET_NAME` = `NOTIFY`
- `SUMMARY_KEYWORD` = `สรุปสถานะ`
- `TELEGRAM_POLL_INTERVAL_SEC` = 5
- Telegram mode: Script Property `TELEGRAM_MODE` = `polling`

## Bot Architecture Notes

- **LINE:** webhook ที่ URL `/exec` — auth ผ่อนคลายถ้า `body.events` เป็น array
- **Telegram:** ใช้ **polling** (`enableTelegramPolling`) ไม่ใช่ webhook — อย่า enable ทั้งสองพร้อมกัน
- Push รายวัน: `getNotifyTargets_().filter(t => t.active && t.dailyPush)`
- อย่า commit token ลง git — ใช้ Script Properties

## Setup Functions (Run ใน GAS Editor)

```
setupBotOnce()           → configureBotSecrets
setupBotStep2()          → installDailyPushTrigger + enableTelegramPolling
enableTelegramPolling()  → หลัง deploy BotNotify.gs
stopTelegramPolling()    → ก่อน reset polling (รอ 1 นาที)
testSendDailyPush()      → ทดสอบ push
repairAllBots()          → reset Telegram polling + แสดง LINE URL
```

## Known Risks

- Public GAS endpoint (Anyone can access)
- Credentials ใน CONFIG sheet + Script Properties
- ไม่มี JWT/OAuth
- LINE message quota จำกัดต่อเดือน
- GAS trigger quota — Telegram polling ใช้ runtime สูง

## Docs

รายละเอียด bot: [BOT_SETUP.md](./BOT_SETUP.md)
