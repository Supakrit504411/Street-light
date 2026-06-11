# Project Rules

1. Never change sheet column indexes without updating mappings.
2. Keep STEP_CONFIG synchronized with frontend.
3. Log all workflow updates to LOG sheet.
4. Preserve backward compatibility for API actions.
5. Use Asia/Bangkok timezone.
6. Never commit bot tokens — use Script Properties (`configureBotSecrets`).
7. NOTIFY sheet: เปลี่ยน DailyPush/Active ไม่ต้องแก้โค้ด.
8. หลังแก้ BotNotify.gs → Deploy New version + Run `enableTelegramPolling()` ถ้าจำเป็น.
9. LINE webhook URL = `/exec` only (no query params).
10. Telegram: ใช้ polling — อย่า enable webhook พร้อม polling.
