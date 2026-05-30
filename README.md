# PEA Tracking — Deploy Guide
## Vercel (Frontend) + GAS (Backend API)

```
Browser (Vercel)
    ↓  fetch POST
GAS doPost()  ←→  Google Sheet / Drive
```

---

## ขั้นตอนที่ 1 — อัปเดต Code.gs

1. เปิด Google Apps Script เดิม
2. **แทนที่** `Code.gs` ทั้งหมดด้วยไฟล์ `Code.gs` ในโฟลเดอร์นี้
3. Deploy ใหม่:
   ```
   Deploy → New Deployment → Web App
   Execute as: Me
   Access: Anyone
   ```
4. คัดลอก **Web App URL** ที่ได้ (ลงท้าย `/exec`)

---

## ขั้นตอนที่ 2 — ตั้งค่า config.js

เปิดไฟล์ `public/config.js` แล้วแทนที่ URL:

```javascript
// เปลี่ยนบรรทัดนี้
window.GAS_URL = 'https://script.google.com/macros/s/REPLACE_WITH_YOUR_DEPLOYMENT_ID/exec';

// เป็น URL จริงของคุณ เช่น
window.GAS_URL = 'https://script.google.com/macros/s/AKfycbxABC123.../exec';
```

---

## ขั้นตอนที่ 3 — Push ขึ้น GitHub

```bash
# สร้าง repo ใหม่ที่ github.com ก่อน แล้วรัน:

git init
git add .
git commit -m "PEA Tracking Web App"
git remote add origin https://github.com/YOUR_USERNAME/pea-tracking.git
git push -u origin main
```

โครงสร้างไฟล์ที่ต้องมีใน repo:
```
pea-tracking/
├── public/
│   ├── index.html     ← หน้าหลัก
│   └── config.js      ← ใส่ GAS URL ตรงนี้
└── README.md
```

---

## ขั้นตอนที่ 4 — Deploy บน Vercel

1. ไปที่ [vercel.com](https://vercel.com) → Sign in ด้วย GitHub
2. กด **Add New Project**
3. เลือก repo `pea-tracking`
4. ตั้งค่า:
   | Setting | Value |
   |---------|-------|
   | Framework Preset | **Other** |
   | Root Directory | `.` (ค่าเริ่มต้น) |
   | Output Directory | `public` |
5. กด **Deploy**

Vercel จะให้ URL เช่น `https://pea-tracking.vercel.app`

---

## ขั้นตอนที่ 5 — ทดสอบ

เปิด URL จาก Vercel แล้วตรวจสอบ:
- [ ] โหลดรายการงานได้
- [ ] เพิ่มงานใหม่ได้
- [ ] อัปโหลดไฟล์ได้
- [ ] เปลี่ยนสถานะได้
- [ ] ดู Log ได้

---

## หมายเหตุสำคัญ

### CORS
GAS `doPost` ตั้งค่า header `Access-Control-Allow-Origin: *` ไว้แล้ว
แต่ GAS **ไม่รองรับ OPTIONS preflight** ดังนั้น frontend ส่ง request เป็น
`Content-Type: text/plain` (simple request) เพื่อหลีกเลี่ยงปัญหานี้

### อัปเดต config.js หลัง deploy
ถ้าต้องเปลี่ยน GAS URL ทีหลัง แก้ `config.js` แล้ว push ขึ้น GitHub
Vercel จะ re-deploy อัตโนมัติภายใน 1-2 นาที

### GAS Quota
- Execution time: 6 นาที/ครั้ง
- URL Fetch: 20,000 ครั้ง/วัน
- สำหรับงานปกติ 100-500 records เพียงพอมาก

### ความปลอดภัย
ตอนนี้ API เปิด public ใครก็เรียกได้
Phase ถัดไปควรเพิ่ม API Key ใน header หรือ Google OAuth
