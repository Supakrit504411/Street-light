// ==========================================
// PEA Tracking Web App — Code.gs (API Mode)
// เพิ่ม doPost() เพื่อรองรับ Vercel frontend
// ==========================================

const SHEET_ID       = '1b0IpzSZL90xy_cjjWpH92qTLVTGrX6vuORpbEloC_-8';
const SHEET_NAME     = 'DATA';
const LOG_SHEET_NAME = 'LOG';
const DRIVE_FOLDER_ID = '1Uysy9114UZ0nEJc-a3_kUL2WGdWMagOY';

const STATUSES = ['รับคำร้อง','ก่อสร้าง','เชื่อมระบบ','ตรวจมาตรฐาน','ติดตั้งมิเตอร์','จ่ายไฟ'];

// ==========================================
// doGet — ยังคงใช้งานได้ (GAS Web App เดิม)
// ==========================================
function doGet(e) {
  return HtmlService
    .createHtmlOutputFromFile('index')
    .setTitle('PEA Tracking')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0');
}

// ==========================================
// doPost — REST API สำหรับ Vercel
// Body JSON: { action: "getData" | "saveData" | ... , ...params }
// ==========================================
function doPost(e) {
  const headers = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const body   = JSON.parse(e.postData.contents);
    const action = body.action;
    let result;

    if      (action === 'getData')      result = getData();
    else if (action === 'saveData')     result = saveData(body.formData);
    else if (action === 'updateStatus') result = updateStatus(body.jobId, body.newStatus, body.stepData);
    else if (action === 'getLog')       result = getLog(body.jobId);
    else if (action === 'uploadFile')   result = uploadFile(body.base64Data, body.fileName, body.mimeType, body.subFolder);
    else result = { success: false, error: 'Unknown action: ' + action };

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ==========================================
// getData
// ==========================================
function getData() {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: true, data: [] };

    const values = sheet.getRange(2, 1, lastRow - 1, 11).getValues();
    const data = values
      .filter(row => row[0] !== '')
      .map(row => ({
        id:          row[0]  || '',
        date:        row[1]  ? Utilities.formatDate(new Date(row[1]), 'Asia/Bangkok', 'dd/MM/yyyy') : '',
        name:        row[2]  || '',
        phone:       row[3]  || '',
        detail:      row[4]  || '',
        status:      row[5]  || '',
        assignee:    row[6]  || '',
        imageUrl:    row[7]  || '',
        fileUrl:     row[8]  || '',
        note:        row[9]  || '',
        updatedDate: row[10] ? Utilities.formatDate(new Date(row[10]), 'Asia/Bangkok', 'dd/MM/yyyy HH:mm') : ''
      }));
    return { success: true, data };
  } catch (e) { return { success: false, error: e.message }; }
}

// ==========================================
// getLog
// ==========================================
function getLog(jobId) {
  try {
    const ss    = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(LOG_SHEET_NAME);
    if (!sheet || sheet.getLastRow() < 2) return { success: true, data: [] };

    const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getValues();
    const data = values
      .filter(row => row[0] !== '' && (!jobId || row[1] === jobId))
      .map(row => ({
        logId:      row[0] || '',
        jobId:      row[1] || '',
        fromStatus: row[2] || '',
        toStatus:   row[3] || '',
        assignee:   row[4] || '',
        note:       row[5] || '',
        fileUrl:    row[6] || '',
        timestamp:  row[7] ? Utilities.formatDate(new Date(row[7]), 'Asia/Bangkok', 'dd/MM/yyyy HH:mm') : ''
      }))
      .reverse();
    return { success: true, data };
  } catch (e) { return { success: false, error: e.message }; }
}

// ==========================================
// saveData
// ==========================================
function saveData(formData) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const now   = new Date();
    const dateStr = Utilities.formatDate(now, 'Asia/Bangkok', 'yyyyMMdd');
    const seq   = String(sheet.getLastRow()).padStart(4, '0');
    const id    = `PEA-${dateStr}-${seq}`;

    sheet.appendRow([id, now, formData.name||'', formData.phone||'', formData.detail||'',
      'รับคำร้อง', formData.assignee||'', formData.imageUrl||'', formData.fileUrl||'',
      formData.note||'', now]);

    _writeLog(id, '', 'รับคำร้อง', formData.assignee||'', formData.note||'', formData.fileUrl||'');
    return { success: true, id };
  } catch (e) { return { success: false, error: e.message }; }
}

// ==========================================
// updateStatus
// ==========================================
function updateStatus(jobId, newStatus, stepData) {
  try {
    if (!STATUSES.includes(newStatus)) return { success: false, error: 'สถานะไม่ถูกต้อง' };
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const data  = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === jobId) {
        const oldStatus = data[i][5];
        sheet.getRange(i+1, 6).setValue(newStatus);
        if (stepData && stepData.assignee) sheet.getRange(i+1, 7).setValue(stepData.assignee);
        if (stepData && stepData.fileUrl) {
          const existing = data[i][8] || '';
          sheet.getRange(i+1, 9).setValue(existing ? existing + '\n' + stepData.fileUrl : stepData.fileUrl);
        }
        sheet.getRange(i+1, 11).setValue(new Date());
        _writeLog(jobId, oldStatus, newStatus,
          (stepData&&stepData.assignee)||'',
          (stepData&&stepData.note)||'',
          (stepData&&stepData.fileUrl)||'');
        return { success: true };
      }
    }
    return { success: false, error: 'ไม่พบงานนี้' };
  } catch (e) { return { success: false, error: e.message }; }
}

// ==========================================
// _writeLog
// ==========================================
function _writeLog(jobId, fromStatus, toStatus, assignee, note, fileUrl) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let logSheet = ss.getSheetByName(LOG_SHEET_NAME);
  if (!logSheet) {
    logSheet = ss.insertSheet(LOG_SHEET_NAME);
    const hdr = ['LogID','JobID','จากสถานะ','ถึงสถานะ','ผู้ดำเนินการ','หมายเหตุ','ไฟล์แนบ','เวลา'];
    logSheet.getRange(1,1,1,hdr.length).setValues([hdr]);
    const hr = logSheet.getRange(1,1,1,hdr.length);
    hr.setBackground('#1B5E20'); hr.setFontColor('#ffffff'); hr.setFontWeight('bold');
    logSheet.setFrozenRows(1);
    [140,160,120,120,130,200,200,150].forEach((w,i) => logSheet.setColumnWidth(i+1,w));
  }
  const now   = new Date();
  const logId = 'LOG-' + Utilities.formatDate(now, 'Asia/Bangkok', 'yyyyMMddHHmmss');
  logSheet.appendRow([logId, jobId, fromStatus, toStatus, assignee, note, fileUrl, now]);
}

// ==========================================
// uploadFile
// ==========================================
function uploadFile(base64Data, fileName, mimeType, subFolder) {
  try {
    const parentFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const folderName   = subFolder || 'FILES';
    const it     = parentFolder.getFoldersByName(folderName);
    const folder = it.hasNext() ? it.next() : parentFolder.createFolder(folderName);
    const decoded = Utilities.base64Decode(base64Data);
    const blob    = Utilities.newBlob(decoded, mimeType, fileName);
    const file    = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return { success: true, url: file.getUrl(),
      previewUrl: `https://drive.google.com/thumbnail?id=${file.getId()}&sz=w400`,
      name: fileName, fileId: file.getId() };
  } catch (e) { return { success: false, error: e.message }; }
}

// ==========================================
// initSheet — run once
// ==========================================
function initSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  const headers = ['ID','วันที่','ชื่อผู้ขอ','เบอร์โทร','รายละเอียด','สถานะ','ผู้รับผิดชอบ','รูปภาพ','ไฟล์แนบ','หมายเหตุ','วันที่อัปเดต'];
  sheet.getRange(1,1,1,headers.length).setValues([headers]);
  const hr = sheet.getRange(1,1,1,headers.length);
  hr.setBackground('#1B5E20'); hr.setFontColor('#ffffff'); hr.setFontWeight('bold');
  sheet.setFrozenRows(1);
  [160,100,150,110,250,120,120,200,200,200,130].forEach((w,i) => sheet.setColumnWidth(i+1,w));
  _writeLog('INIT','','','','initSheet called','');
  return { success: true, message: 'Sheets initialized' };
}
