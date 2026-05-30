// ============================================================
// sheet.js — Bottom Sheet (Job Detail, Step Form, Log)
// แก้ UI ของ sheet หรือ logic เปลี่ยนสถานะที่นี่
// ============================================================

function openSheet(jobId) {
  selectedJob = allJobs.find(j => j.id === jobId);
  if (!selectedJob) return;
  currentSheetTab = 'detail';
  document.getElementById('step-assignee').value = selectedJob.assignee || '';
  document.getElementById('step-note').value = '';
  document.getElementById('step-file-preview').innerHTML = '';
  pendingStepFile = null;
  renderSheetHeader();
  switchSheetTab('detail', document.querySelectorAll('.sheet-tab')[0]);
  document.getElementById('backdrop').classList.add('open');
  document.getElementById('jobSheet').classList.add('open');
}

function closeSheet() {
  document.getElementById('backdrop').classList.remove('open');
  document.getElementById('jobSheet').classList.remove('open');
}

function renderSheetHeader() {
  const j = selectedJob;
  document.getElementById('sheetName').textContent = j.name;
  document.getElementById('sheetSub').textContent  = j.id + ' · อัปเดต: ' + (j.updatedDate || j.date);
}

function switchSheetTab(tab, el) {
  currentSheetTab = tab;
  document.querySelectorAll('.sheet-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('tabDetail').style.display  = tab === 'detail' ? 'block' : 'none';
  document.getElementById('tabStep').style.display    = tab === 'step'   ? 'block' : 'none';
  document.getElementById('tabLog').style.display     = tab === 'log'    ? 'block' : 'none';
  document.getElementById('stepBtnRow').style.display = tab === 'step'   ? 'flex'  : 'none';
  if (tab === 'detail') renderDetailTab();
  if (tab === 'step')   renderStepTab();
  if (tab === 'log')    loadLog();
}

function renderDetailTab() {
  const j  = selectedJob;
  const si = STATUSES.indexOf(j.status);
  const sc = si >= 0 ? STATUS_CLASS[si] : 's0';
  const rows = [
    ['สถานะ',         `<span class="status-badge ${sc}">${j.status}</span>`],
    ['เบอร์โทร',     `<a href="tel:${j.phone}" style="color:var(--pea)">${j.phone}</a>`],
    ['รายละเอียด',   j.detail   || '—'],
    ['ผู้รับผิดชอบ', j.assignee || '—'],
    ['หมายเหตุ',     j.note     || '—'],
    ['วันที่สร้าง',  j.date     || '—'],
  ].map(([l,v]) => `<div class="detail-row"><div class="detail-label">${l}</div><div class="detail-value">${v}</div></div>`).join('');
  const imgHtml  = j.imageUrl ? `<div class="detail-row"><div class="detail-label">รูปภาพ</div><a href="${j.imageUrl}" target="_blank" style="color:var(--pea);font-size:13px">ดูรูปภาพ ↗</a></div>` : '';
  const fileHtml = j.fileUrl  ? j.fileUrl.split('\n').map((u,i) =>
    `<div class="detail-row"><div class="detail-label">ไฟล์แนบ ${i+1}</div><a href="${u}" target="_blank" style="color:var(--pea);font-size:13px">ดูไฟล์ ↗</a></div>`).join('') : '';
  document.getElementById('tabDetail').innerHTML = rows + imgHtml + fileHtml;
}

function renderStepTab() {
  const si      = STATUSES.indexOf(selectedJob.status);
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  btnPrev.style.display = 'none';
  btnNext.disabled      = si >= STATUSES.length - 1;
  btnNext.textContent   = si >= STATUSES.length - 1 ? '✓ เสร็จสิ้นแล้ว' : `→ ${STATUSES[si+1]}`;
}

// ── Log ──
async function loadLog() {
  document.getElementById('logContent').innerHTML = '<div style="padding:20px;text-align:center;color:#999;font-size:13px">กำลังโหลด...</div>';
  try {
    const res = await gasAPI('getLog', { jobId: selectedJob.id });
    if (res.success) renderLog(res.data);
    else document.getElementById('logContent').innerHTML = '<div style="padding:16px;color:#999;font-size:13px">โหลด log ไม่สำเร็จ</div>';
  } catch(e) {
    document.getElementById('logContent').innerHTML = '<div style="padding:16px;color:#999;font-size:13px">เกิดข้อผิดพลาด</div>';
  }
}

function renderLog(logs) {
  if (!logs.length) {
    document.getElementById('logContent').innerHTML = '<div style="padding:24px;text-align:center;color:#999;font-size:13px">ยังไม่มีประวัติ</div>';
    return;
  }
  document.getElementById('logContent').innerHTML = `<div class="log-timeline">` + logs.map(l => {
    const toSi  = STATUSES.indexOf(l.toStatus);
    const col   = toSi >= 0 ? STATUS_COLOR[toSi]  : '#888';
    const bg    = toSi >= 0 ? LOG_DOT_BG[toSi]    : '#f3f4f6';
    const arrow = l.fromStatus
      ? `<span class="arrow-from">${l.fromStatus}</span> → <strong>${l.toStatus}</strong>`
      : `เริ่มงาน: <strong>${l.toStatus}</strong>`;
    return `<div class="log-item">
      <div class="log-dot" style="background:${bg};color:${col}">${toSi+1}</div>
      <div class="log-content">
        <div class="log-arrow">${arrow}</div>
        <div class="log-meta">${l.timestamp}${l.assignee ? ' · ' + l.assignee : ''}</div>
        ${l.note    ? `<div class="log-note">${l.note}</div>`                            : ''}
        ${l.fileUrl ? `<div class="log-file"><a href="${l.fileUrl}" target="_blank">ดูไฟล์แนบ ↗</a></div>` : ''}
      </div></div>`;
  }).join('') + `</div>`;
}

// ── Change Status ──
function requestChangeStatus(dir) {
  if (dir === 1 && !pendingStepFile) {
    showToast('กรุณาแนบไฟล์ก่อนดำเนินการต่อ', 'error');
    return;
  }
  const j        = selectedJob;
  const si       = STATUSES.indexOf(j.status);
  const newSi    = si + dir;
  if (newSi < 0 || newSi >= STATUSES.length) return;
  const newStatus = STATUSES[newSi];
  const assignee  = document.getElementById('step-assignee').value.trim();
  const note      = document.getElementById('step-note').value.trim();

  const summary = [
    ['งาน',          j.id],
    ['ชื่อผู้ขอ',    j.name],
    ['จากสถานะ',     j.status],
    ['เป็นสถานะ',    newStatus],
    ['ผู้ดำเนินการ', assignee || '(ไม่ระบุ)'],
    ['หมายเหตุ',     note     || '(ไม่มี)'],
    ['ไฟล์แนบ',      pendingStepFile ? pendingStepFile.name : '(ไม่มี)'],
  ].map(([k,v]) => `<div class="dialog-summary-row"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('');

  openConfirm({
    title:     'ยืนยันการเปลี่ยนสถานะ',
    desc:      'ตรวจสอบข้อมูลก่อนบันทึก',
    summary,
    onConfirm: () => doChangeStatus(dir, assignee, note)
  });
}

async function doChangeStatus(dir, assignee, note) {
  if (dir !== 1) return;
  const j         = selectedJob;
  const si        = STATUSES.indexOf(j.status);
  const newStatus = STATUSES[si + dir];

  try {
    let fileUrl = '';
    if (pendingStepFile) {
      const b64 = await fileToBase64(pendingStepFile);
      const res = await gasAPI('uploadFile', { base64Data:b64, fileName:pendingStepFile.name, mimeType:pendingStepFile.type, subFolder:'STEP_FILES' });
      if (res.success) fileUrl = res.url;
    }

    const res = await gasAPI('updateStatus', { jobId:j.id, newStatus, stepData:{ assignee, note, fileUrl } });
    closeConfirm();

    if (res.success) {
      const idx = allJobs.findIndex(jj => jj.id === j.id);
      if (idx >= 0) { allJobs[idx].status = newStatus; if (assignee) allJobs[idx].assignee = assignee; }
      selectedJob.status = newStatus;
      if (assignee) selectedJob.assignee = assignee;
      renderSheetHeader(); renderStepTab();
      renderList(); renderDash(); updateSummary(); renderKPI();
      document.getElementById('step-note').value = '';
      document.getElementById('step-file-preview').innerHTML = '';
      pendingStepFile = null;
      showToast('อัปเดตเป็น: ' + newStatus, 'success');
    } else showToast('อัปเดตไม่สำเร็จ: ' + res.error, 'error');

  } catch(e) { closeConfirm(); showToast('เกิดข้อผิดพลาด: ' + e.message, 'error'); }
}