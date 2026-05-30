// ============================================================
// state.js — Global state & constants
// ทุก module import จากไฟล์นี้
// ============================================================

const STATUSES    = ['รับคำร้อง','ก่อสร้าง','เชื่อมระบบ','ตรวจมาตรฐาน','ติดตั้งมิเตอร์','จ่ายไฟ'];
const STATUS_CLASS = ['s0','s1','s2','s3','s4','s5'];
const STATUS_COLOR = ['#7C3AED','#EA580C','#2563EB','#D97706','#DB2777','#16A34A'];
const LOG_DOT_BG   = ['#EDE7F6','#FFF3E0','#E3F2FD','#FFF8E1','#FCE4EC','#E8F5E9'];

let allJobs        = [];
let currentFilter  = 'all';
let selectedJob    = null;
let pendingImg     = null;
let pendingPdf     = null;
let pendingStepFile = null;
let confirmCallback = null;
let currentSheetTab = 'detail';