function openSheet(jobId) {
  selectedJob = allJobs.find(job => job.id === jobId);
  if (!selectedJob) return;
  currentSheetTab = 'step';
  pendingStepFile = null;
  renderSheetHeader();
  switchSheetTab('step', document.querySelectorAll('.sheet-tab')[0]);
  document.getElementById('backdrop').classList.add('open');
  document.getElementById('jobSheet').classList.add('open');
}

function closeSheet() {
  document.getElementById('backdrop').classList.remove('open');
  document.getElementById('jobSheet').classList.remove('open');
}

function renderSheetHeader() {
  const job = selectedJob;
  document.getElementById('sheetName').textContent = job.detail.peaNo || job.detail.wbs || job.id;
  document.getElementById('sheetSub').textContent = `${job.id} | อัปเดต: ${job.updatedAt || '-'}`;
}

function switchSheetTab(tab, el) {
  currentSheetTab = tab;
  document.querySelectorAll('.sheet-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('tabStep').style.display = tab === 'step' ? 'block' : 'none';
  document.getElementById('tabLog').style.display = tab === 'log' ? 'block' : 'none';
  if (tab === 'step') renderStepTab();
  if (tab === 'log') loadLog();
}

function renderFileLink(url, label = 'ไฟล์แนบ') {
  if (!url) return '<span class="muted-inline">ไม่มีไฟล์</span>';
  return `<a href="${url}" target="_blank" class="file-link" onmouseenter="showFilePreview(event, '${url}')" onmousemove="moveFilePreview(event)" onmouseleave="hideFilePreview()">${label}</a>`;
}

function renderStepTab() {
  const job = selectedJob;
  const rows = job.steps.map((step, index) => {
    const canEdit = canEditStep(step, index, job);
    return `<div class="step-card ${step.value === 'YES' ? 'done' : ''}">
      <div class="step-card-top">
        <div>
          <div class="step-title">${index + 1}. ${step.label}</div>
          <div class="step-sub">สถานะ: ${step.value}${step.locked ? ' | ล็อกแล้ว' : ''}</div>
        </div>
        <button class="step-inline-btn" ${canEdit ? '' : 'disabled'} onclick="requestStepUpdate('${step.key}')">ยืนยัน YES</button>
      </div>
      <div class="step-link">${renderFileLink(step.fileUrl)}</div>
    </div>`;
  }).join('');

  document.getElementById('tabStep').innerHTML = `
    <div class="step-form">
      <div class="form-label">หมายเหตุ</div>
      <textarea class="form-textarea" id="step-note" placeholder="บันทึกรายละเอียดการยืนยันขั้นตอน"></textarea>
      <div class="form-label">ไฟล์แนบ (บังคับเมื่อยืนยัน YES)</div>
      <div class="upload-area">
        <input type="file" id="step-file" onchange="handleStepFile(event)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <div>แตะเพื่อแนบไฟล์</div>
      </div>
      <div id="step-file-preview" class="upload-preview"></div>
      <div class="step-grid">${rows}</div>
    </div>`;
}

function canEditStep(step, index, job) {
  if (!currentUser) return false;
  if (step.locked && !currentUser.isAdmin) return false;
  if (!(currentUser.isAdmin || currentUser.allowedSteps.includes('ALL') || currentUser.allowedSteps.includes(step.key))) return false;
  for (let i = 0; i < index; i++) {
    if (job.steps[i].value !== 'YES') return false;
  }
  return step.value !== 'YES' || currentUser.isAdmin;
}

function requestStepUpdate(stepKey) {
  if (!ensureLoggedIn()) return;
  if (!pendingStepFile) {
    showToast('กรุณาแนบไฟล์ก่อนยืนยันขั้นตอน', 'error');
    return;
  }
  const step = selectedJob.steps.find(item => item.key === stepKey);
  const note = document.getElementById('step-note').value.trim();
  const summary = [
    ['งาน', selectedJob.id],
    ['ขั้นตอน', step.label],
    ['สถานะใหม่', 'YES'],
    ['ผู้ใช้', currentUser.username],
    ['ไฟล์แนบ', pendingStepFile.name]
  ].map(([k, v]) => `<div class="dialog-summary-row"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('');

  openConfirm({
    title: 'ยืนยันการอัปเดตขั้นตอน',
    desc: 'เมื่อยืนยันแล้วจะกลับไปแก้ไม่ได้ ยกเว้น Admin',
    summary,
    onConfirm: () => doStepUpdate(stepKey, note)
  });
}

async function doStepUpdate(stepKey, note) {
  try {
    const b64 = await fileToBase64(pendingStepFile);
    const upload = await gasAPI('uploadFile', {
      base64Data: b64,
      fileName: pendingStepFile.name,
      mimeType: pendingStepFile.type,
      subFolder: stepKey
    });
    if (!upload.success) throw new Error(upload.error || 'อัปโหลดไฟล์ไม่สำเร็จ');

    const res = await gasAPI('updateStep', {
      payload: {
        jobId: selectedJob.id,
        stepKey,
        value: 'YES',
        note,
        fileUrl: upload.url,
        auth: currentAuth
      }
    });
    closeConfirm();
    if (!res.success) throw new Error(res.error || 'บันทึกไม่สำเร็จ');

    await bootstrapApp();
    selectedJob = allJobs.find(job => job.id === selectedJob.id);
    pendingStepFile = null;
    renderSheetHeader();
    renderStepTab();
    showToast('บันทึกขั้นตอนเรียบร้อย', 'success');
  } catch (e) {
    closeConfirm();
    showToast(e.message, 'error');
  }
}

async function loadLog() {
  document.getElementById('logContent').innerHTML = '<div style="padding:20px;text-align:center;color:#667085;font-size:13px">กำลังโหลด...</div>';
  try {
    const res = await gasAPI('getLog', { jobId: selectedJob.id });
    if (!res.success) throw new Error(res.error || 'โหลด log ไม่สำเร็จ');
    renderLog(res.data || []);
  } catch (e) {
    document.getElementById('logContent').innerHTML = `<div style="padding:16px;color:#667085;font-size:13px">${e.message}</div>`;
  }
}

function renderLog(logs) {
  if (!logs.length) {
    document.getElementById('logContent').innerHTML = '<div style="padding:24px;text-align:center;color:#667085;font-size:13px">ยังไม่มีประวัติ</div>';
    return;
  }

  document.getElementById('logContent').innerHTML = `<div class="log-timeline">` + logs.map((log, index) => `
    <div class="log-item">
      <div class="log-dot" style="background:#eef4fb;color:#1f3a5f">${index + 1}</div>
      <div class="log-content">
        <div class="log-arrow"><strong>${log.stepLabel}</strong> ${log.fromValue ? `${log.fromValue} -> ${log.toValue}` : log.toValue}</div>
        <div class="log-meta">${log.timestamp || '-'} | ${log.actor || '-'}</div>
        ${log.note ? `<div class="log-note">${log.note}</div>` : ''}
        ${log.fileUrl ? `<div class="log-file">${renderFileLink(log.fileUrl)}</div>` : ''}
      </div>
    </div>
  `).join('') + `</div>`;
}

function showFilePreview(event, url) {
  const preview = document.getElementById('fileHoverPreview');
  if (!preview || !url) return;
  preview.innerHTML = `<div class="file-hover-card">
    <div class="file-hover-title">Preview ไฟล์แนบ</div>
    <iframe src="${url}" loading="lazy"></iframe>
  </div>`;
  preview.classList.add('open');
  moveFilePreview(event);
}

function moveFilePreview(event) {
  const preview = document.getElementById('fileHoverPreview');
  if (!preview || !preview.classList.contains('open')) return;
  preview.style.left = `${event.clientX + 18}px`;
  preview.style.top = `${event.clientY + 18}px`;
}

function hideFilePreview() {
  const preview = document.getElementById('fileHoverPreview');
  if (!preview) return;
  preview.classList.remove('open');
  preview.innerHTML = '';
}
