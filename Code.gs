const SHEET_ID = '1b0IpzSZL90xy_cjjWpH92qTLVTGrX6vuORpbEloC_-8';
const SHEET_NAME = 'WBS';
const LOG_SHEET_NAME = 'LOG';
const CONFIG_SHEET_NAME = 'CONFIG';
const DRIVE_FOLDER_ID = '1Uysy9114UZ0nEJc-a3_kUL2WGdWMagOY';
const TIMEZONE = 'Asia/Bangkok';

const STEP_CONFIG = [
  { key: 'constructionStatus', label: 'สถานะก่อสร้าง', statusCol: 15, fileCol: 27 },
  { key: 'hotlineConnection', label: 'เชื่อมฮอทไลน์', statusCol: 16, fileCol: 28 },
  { key: 'jobInspection', label: 'ตรวจรับงาน', statusCol: 17, fileCol: 29 },
  { key: 'standardInspection', label: 'ตรวจมาตรฐาน', statusCol: 18, fileCol: 30 },
  { key: 'requestCreation', label: 'สร้างคำร้อง', statusCol: 19, fileCol: 31 },
  { key: 'requestReview', label: 'ตรวจคำร้อง', statusCol: 20, fileCol: 32 },
  { key: 'feePayment', label: 'ชำระเงิน', statusCol: 21, fileCol: 33 },
  { key: 'meterInstallation', label: 'ติดตั้งมิเตอร์', statusCol: 22, fileCol: 34 },
  { key: 'powerRelease', label: 'จ่ายไฟ', statusCol: 23, fileCol: 35 },
  { key: 'closeoutPending', label: 'พร้อมปิด', statusCol: 24, fileCol: 36 }
];

const DETAIL_FIELDS = [
  { key: 'wbs', label: 'WBS', col: 1 },
  { key: 'peaNo', label: 'PEA NO หม้อแปลง', col: 2 },
  { key: 'description', label: 'คำอธิบาย', col: 3 },
  { key: 'teamPrimary', label: 'ทีม', col: 4 },
  { key: 'teamSecondary', label: 'ทีม', col: 5 },
  { key: 'supervisor', label: 'ผู้ควบคุมงาน', col: 6 },
  { key: 'systemStatus', label: 'สถานะระบบ', col: 7 },
  { key: 'statusText', label: 'สถานะ', col: 8 },
  { key: 'materialPct', label: '%เบิกพัสดุ', col: 9 },
  { key: 'withdrawPct', label: '%เบิก ค่าแรง', col: 10 },
  { key: 'laborCost', label: 'ค่าแรง', col: 11 },
  { key: 'paymentDate', label: 'วันชำระเงิน', col: 12, type: 'date' },
  { key: 'openDate', label: 'วันเปิดงาน', col: 13, type: 'date' },
  { key: 'month', label: 'เดือน', col: 14 }
];

const UPDATED_AT_COL = 25; // Y
const TRANSFORMER_COL = 26; // Z

function doGet() {
  return HtmlService
    .createHtmlOutputFromFile('index')
    .setTitle('PEA Tracking')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0');
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    const action = body.action;
    let result;

    if (action === 'getBootstrap') result = getBootstrap();
    else if (action === 'login') result = login(body.username, body.password);
    else if (action === 'updateStep') result = updateStep(body.payload || {});
    else if (action === 'updateTransformer') result = updateTransformer(body.jobId, body.transformer, body.auth || {});
    else if (action === 'getLog') result = getLog(body.jobId);
    else if (action === 'uploadFile') result = uploadFile(body.base64Data, body.fileName, body.mimeType, body.subFolder);
    else result = { success: false, error: 'Unknown action: ' + action };

    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getBootstrap() {
  return {
    success: true,
    jobs: getData_(),
    stepConfig: STEP_CONFIG.map(step => ({ key: step.key, label: step.label })),
    permissions: {
      allUsersSharedSteps: ['jobInspection', 'standardInspection']
    }
  };
}

function login(username, password) {
  try {
    const users = getUsers_();
    const user = users.find(item => item.username === username && item.password === password && item.active);
    if (!user) return { success: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };

    return {
      success: true,
      user: {
        username: user.username,
        role: user.role,
        isAdmin: user.isAdmin,
        allowedSteps: user.allowedSteps
      }
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function getData_() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, 36).getValues();
  return values
    .filter(row => String(row[0] || '').trim() !== '')
    .map((row, index) => mapRowToJob_(row, index + 2));
}

function mapRowToJob_(row, rowNumber) {
  const detail = {};
  DETAIL_FIELDS.forEach(field => {
    detail[field.key] = formatValue_(row[field.col - 1], field.type);
  });

  const steps = STEP_CONFIG.map((step, index) => ({
    key: step.key,
    label: step.label,
    index,
    value: normalizeYesNo_(row[step.statusCol - 1]),
    fileUrl: String(row[step.fileCol - 1] || ''),
    locked: normalizeYesNo_(row[step.statusCol - 1]) === 'YES'
  }));

  return {
    id: String(row[0] || ''),
    rowNumber,
    detail,
    steps,
    updatedAt: formatValue_(row[UPDATED_AT_COL - 1], 'datetime'),
    transformer: String(row[TRANSFORMER_COL - 1] || ''),
    currentStepIndex: getCurrentStepIndex_(steps),
    isComplete: steps.every(step => step.value === 'YES'),
    latestStep: getLatestStep_(steps),
    latestFileUrl: getLatestFileUrl_(steps)
  };
}

function updateStep(payload) {
  try {
    const jobId = payload.jobId;
    const stepKey = payload.stepKey;
    const value = normalizeYesNo_(payload.value);
    const note = String(payload.note || '');
    const fileUrl = String(payload.fileUrl || '');
    const auth = payload.auth || {};

    if (value !== 'YES') return { success: false, error: 'ระบบนี้อนุญาตยืนยันเป็น YES เท่านั้น' };
    if (!fileUrl) return { success: false, error: 'ต้องแนบไฟล์ก่อนยืนยันขั้นตอน' };

    const user = validateAuth_(auth.username, auth.password);
    const step = STEP_CONFIG.find(item => item.key === stepKey);
    if (!step) return { success: false, error: 'ไม่พบขั้นตอนที่ต้องการ' };
    if (!canEditStep_(user, stepKey)) return { success: false, error: 'ไม่มีสิทธิ์แก้ไขขั้นตอนนี้' };

    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) !== String(jobId)) continue;

      const currentValue = normalizeYesNo_(data[i][step.statusCol - 1]);
      if (currentValue === 'YES' && !user.isAdmin) {
        return { success: false, error: 'ขั้นตอนนี้ถูกยืนยันแล้ว แก้ไขได้เฉพาะ Admin' };
      }

      const stepIndex = STEP_CONFIG.findIndex(item => item.key === stepKey);
      for (let prev = 0; prev < stepIndex; prev++) {
        const prevValue = normalizeYesNo_(data[i][STEP_CONFIG[prev].statusCol - 1]);
        if (prevValue !== 'YES') {
          return { success: false, error: 'ต้องยืนยันขั้นตอนก่อนหน้าให้ครบตามลำดับ O -> X' };
        }
      }

      sheet.getRange(i + 1, step.statusCol).setValue('YES');
      sheet.getRange(i + 1, step.fileCol).setValue(fileUrl);
      if (stepIndex + 1 < STEP_CONFIG.length) {
        const nextStep = STEP_CONFIG[stepIndex + 1];
        if (!String(data[i][nextStep.statusCol - 1] || '').trim()) {
          sheet.getRange(i + 1, nextStep.statusCol).setValue('NO');
        }
      }
      sheet.getRange(i + 1, UPDATED_AT_COL).setValue(new Date());

      writeLog_({
        jobId,
        stepKey,
        stepLabel: step.label,
        fromValue: currentValue,
        toValue: 'YES',
        actor: user.username,
        note,
        fileUrl
      });

      return { success: true };
    }

    return { success: false, error: 'ไม่พบงานนี้' };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function updateTransformer(jobId, transformer, auth) {
  try {
    validateAuth_(auth.username, auth.password);
    const allowed = ['PEA', 'CUS', ''];
    if (allowed.indexOf(transformer) === -1) {
      return { success: false, error: 'ค่า Transformer ไม่ถูกต้อง' };
    }

    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) !== String(jobId)) continue;
      sheet.getRange(i + 1, TRANSFORMER_COL).setValue(transformer);
      sheet.getRange(i + 1, UPDATED_AT_COL).setValue(new Date());
      writeLog_({
        jobId,
        stepKey: 'transformer',
        stepLabel: 'Transformer?',
        fromValue: String(data[i][TRANSFORMER_COL - 1] || ''),
        toValue: transformer,
        actor: auth.username || '',
        note: 'อัปเดต Transformer',
        fileUrl: ''
      });
      return { success: true };
    }

    return { success: false, error: 'ไม่พบงานนี้' };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function getLog(jobId) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(LOG_SHEET_NAME);
    if (!sheet || sheet.getLastRow() < 2) return { success: true, data: [] };

    const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 10).getValues();
    const data = values
      .filter(row => row[0] && (!jobId || String(row[1]) === String(jobId)))
      .map(row => ({
        logId: String(row[0] || ''),
        jobId: String(row[1] || ''),
        stepKey: String(row[2] || ''),
        stepLabel: String(row[3] || ''),
        fromValue: String(row[4] || ''),
        toValue: String(row[5] || ''),
        actor: String(row[6] || ''),
        note: String(row[7] || ''),
        fileUrl: String(row[8] || ''),
        timestamp: row[9] ? Utilities.formatDate(new Date(row[9]), TIMEZONE, 'dd/MM/yyyy HH:mm') : ''
      }))
      .reverse();
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function writeLog_(entry) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let logSheet = ss.getSheetByName(LOG_SHEET_NAME);
  if (!logSheet) {
    logSheet = ss.insertSheet(LOG_SHEET_NAME);
    const header = ['LogID', 'JobID', 'StepKey', 'StepLabel', 'FromValue', 'ToValue', 'Actor', 'Note', 'FileURL', 'Timestamp'];
    logSheet.getRange(1, 1, 1, header.length).setValues([header]);
  }

  const now = new Date();
  const logId = 'LOG-' + Utilities.formatDate(now, TIMEZONE, 'yyyyMMddHHmmss');
  logSheet.appendRow([
    logId,
    entry.jobId,
    entry.stepKey,
    entry.stepLabel,
    entry.fromValue,
    entry.toValue,
    entry.actor,
    entry.note,
    entry.fileUrl,
    now
  ]);
}

function uploadFile(base64Data, fileName, mimeType, subFolder) {
  try {
    const parentFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const folderName = subFolder || 'FILES';
    const folderIterator = parentFolder.getFoldersByName(folderName);
    const folder = folderIterator.hasNext() ? folderIterator.next() : parentFolder.createFolder(folderName);
    const decoded = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(decoded, mimeType, fileName);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return { success: true, url: file.getUrl(), fileId: file.getId(), name: fileName };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function getUsers_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(CONFIG_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG_SHEET_NAME);
  }

  ensureConfigSheetSetup_(sheet);

  if (sheet.getLastRow() < 2) return [];
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues();
  return values
    .filter(row => String(row[0] || '').trim() !== '')
    .map(row => {
      const allowed = String(row[3] || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
      const role = String(row[2] || 'USER').toUpperCase();
      return {
        username: String(row[0] || '').trim(),
        password: String(row[1] || '').trim(),
        role,
        isAdmin: role === 'ADMIN' || String(row[0] || '').trim().toLowerCase() === 'admin',
        allowedSteps: allowed[0] === 'ALL' ? ['ALL'] : allowed,
        active: normalizeYesNo_(row[4]) === 'YES'
      };
    });
}

function validateAuth_(username, password) {
  const users = getUsers_();
  const user = users.find(item => item.username === username && item.password === password && item.active);
  if (!user) throw new Error('สิทธิ์ไม่ถูกต้องหรือ session หมดอายุ');
  return user;
}

function canEditStep_(user, stepKey) {
  return user.isAdmin || user.allowedSteps.indexOf('ALL') >= 0 || user.allowedSteps.indexOf(stepKey) >= 0;
}

function normalizeYesNo_(value) {
  return String(value || '').toUpperCase() === 'YES' ? 'YES' : 'NO';
}

function formatValue_(value, type) {
  if (value === null || value === undefined || value === '') return '';
  if (type === 'date') return Utilities.formatDate(new Date(value), TIMEZONE, 'dd/MM/yyyy');
  if (type === 'datetime') return Utilities.formatDate(new Date(value), TIMEZONE, 'dd/MM/yyyy HH:mm');
  return String(value);
}

function getCurrentStepIndex_(steps) {
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].value !== 'YES') return i;
  }
  return steps.length - 1;
}

function getLatestStep_(steps) {
  for (let i = steps.length - 1; i >= 0; i--) {
    if (steps[i].value === 'YES') return steps[i];
  }
  return steps[0] || null;
}

function getLatestFileUrl_(steps) {
  for (let i = steps.length - 1; i >= 0; i--) {
    if (steps[i].value === 'YES' && steps[i].fileUrl) return steps[i].fileUrl;
  }
  return '';
}

function ensureConfigSheetSetup_(sheet) {
  const expectedHeader = ['Username', 'Password', 'Role', 'AllowedSteps', 'Active'];
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  if (lastRow < 1 || lastCol < expectedHeader.length) {
    sheet.getRange(1, 1, 1, expectedHeader.length).setValues([expectedHeader]);
  } else {
    const header = sheet.getRange(1, 1, 1, expectedHeader.length).getValues()[0];
    const normalized = header.map(item => String(item || '').trim());
    const mismatch = expectedHeader.some((value, index) => normalized[index] !== value);
    if (mismatch) {
      sheet.getRange(1, 1, 1, expectedHeader.length).setValues([expectedHeader]);
    }
  }

  if (sheet.getLastRow() < 2) {
    sheet.getRange(2, 1, 5, 5).setValues([
      ['Admin', '12345', 'ADMIN', 'ALL', 'YES'],
      ['ผกส', '12345', 'USER', 'constructionStatus,closeoutPending,jobInspection,standardInspection', 'YES'],
      ['ผปบ', '12345', 'USER', 'hotlineConnection,powerRelease,jobInspection,standardInspection', 'YES'],
      ['ผบส', '12345', 'USER', 'requestCreation,requestReview,feePayment,jobInspection,standardInspection', 'YES'],
      ['ผมต', '12345', 'USER', 'meterInstallation,jobInspection,standardInspection', 'YES']
    ]);
  }
}
