function openSheet(jobId) {
  selectedJob = allJobs.find(job => job.id === jobId);
  if (!selectedJob) return;
  currentSheetTab = 'step';
  pendingStepFile = null;
  pendingStepKey = null;
  closeStepUpdateModal();
  renderSheetHeader();
  switchSheetTab('step', document.querySelectorAll('.sheet-tab')[0]);
  document.getElementById('backdrop').classList.add('open');
  document.getElementById('jobSheet').classList.add('open');
}

function closeSheet() {
  closeStepUpdateModal();
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

function extractDriveId(url) {
  if (!url) return null;
  // รองรับ https://drive.google.com/file/d/FILE_ID/view
  const m = url.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
  return m ? m[1] : null;
}

function renderFileLink(url, label = null) {
  if (!url) return '<span class="muted-inline">ไม่มีไฟล์</span>';
  let displayName = label;
  if (!displayName) {
    try {
      const parts = decodeURIComponent(url).split(/[/?]/);
      displayName = parts.find(p => p.match(/\.[a-z]{2,5}$/i)) || 'ดูไฟล์';
    } catch { displayName = 'ดูไฟล์'; }
  }
  const fileId = extractDriveId(url);
  const thumbUrl = fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w400` : null;
  const dataThumb = thumbUrl ? `data-thumb="${thumbUrl}"` : '';
  return `<a href="${url}" target="_blank" class="file-link"
    onclick="event.stopPropagation()"
    onmouseenter="showFilePreview(event,'${url}','${thumbUrl || ''}')"
    onmousemove="moveFilePreview(event)"
    onmouseleave="hideFilePreview()"
    ${dataThumb}>📎 ${displayName}</a>`;
}

function renderStepTab() {
  const job = selectedJob;

  // step แรกที่ยังเป็น NO = จุดค้างของ workflow (ใช้แสดง highlight เท่านั้น)
  const activeIndex = job.steps.findIndex(s => s.value !== 'YES');

  const rows = job.steps.map((step, index) => {
    const isDone    = step.value === 'YES';
    const isBlocked = index === activeIndex;
    const canEdit   = canEditStep(step, index, job);

    let btnHtml = '';
    if (isDone) {
      btnHtml = `<span class="step-done-label">✓ ยืนยันแล้ว</span>`;
    } else if (canEdit) {
      btnHtml = `<button class="step-inline-btn"
        onclick="event.stopPropagation();openStepUpdateModal('${step.key}')">ยืนยัน</button>`;
    } else {
      btnHtml = `<button class="step-inline-btn" disabled>ไม่มีสิทธิ์</button>`;
    }

    return `<div class="step-card ${isDone ? 'done' : isBlocked ? 'active-step' : 'pending-step'}">
      <div class="step-card-top">
        <div>
          <div class="step-title">${index + 1}. ${step.label}${isBlocked && !isDone ? ' <span class="step-block-tag">ค้างอยู่ที่</span>' : ''}</div>
          <div class="step-sub">
            <span class="step-value-badge ${isDone ? 'badge-yes' : 'badge-no'}">${isDone ? '✓ YES' : 'NO'}</span>
            ${step.locked && !isDone ? '<span class="badge-locked">🔒</span>' : ''}
          </div>
        </div>
        ${btnHtml}
      </div>
      <div class="step-link">${renderFileLink(step.fileUrl)}</div>
    </div>`;
  }).join('');

  document.getElementById('tabStep').innerHTML = `<div class="step-form"><div class="step-grid">${rows}</div></div>`;
}

function openStepUpdateModal(stepKey) {
  if (!ensureLoggedIn()) return;
  const step = selectedJob.steps.find(item => item.key === stepKey);
  if (!step) return;

  pendingStepKey = stepKey;
  pendingStepFile = null;

  document.getElementById('stepModalTitle').textContent = 'ยืนยัน: ' + step.label;
  document.getElementById('stepModalNote').value = '';
  document.getElementById('stepModalFile').value = '';
  document.getElementById('stepModalFilePreview').innerHTML = '';

  const lowPowerWrap = document.getElementById('stepModalLowPowerWrap');
  const isHotline = stepKey === 'hotlineConnection';
  if (lowPowerWrap) {
    lowPowerWrap.style.display = isHotline ? 'block' : 'none';
    document.getElementById('stepModalLowPower').checked = false;
  }

  resetStepModalSubmitBtn();
  updateStepModalFileRequired();
  document.getElementById('stepUpdateModal').classList.add('open');
}

function closeStepUpdateModal() {
  document.getElementById('stepUpdateModal').classList.remove('open');
  pendingStepKey = null;
  pendingStepFile = null;
  resetStepModalSubmitBtn();
}

function resetStepModalSubmitBtn() {
  const btn = document.getElementById('stepModalSubmitBtn');
  const text = document.getElementById('stepModalSubmitText');
  const spinner = document.getElementById('stepModalSpinner');
  if (btn) btn.disabled = false;
  if (text) text.textContent = 'ยืนยัน';
  if (spinner) spinner.style.display = 'none';
}

function updateStepModalFileRequired() {
  const isHotline = pendingStepKey === 'hotlineConnection';
  const lowPowerEl = document.getElementById('stepModalLowPower');
  const lowPower = isHotline && lowPowerEl && lowPowerEl.checked;
  const fileSection = document.getElementById('stepModalFileSection');
  const fileLabel = document.getElementById('stepModalFileLabel');

  if (lowPower) {
    if (fileSection) fileSection.style.display = 'none';
    pendingStepFile = null;
  } else {
    if (fileSection) fileSection.style.display = 'block';
    if (fileLabel) fileLabel.textContent = 'ไฟล์แนบ (บังคับเมื่อยืนยัน YES)';
  }
}

function submitStepUpdateModal() {
  if (!pendingStepKey) return;
  const isHotline = pendingStepKey === 'hotlineConnection';
  const lowPowerEl = document.getElementById('stepModalLowPower');
  const lowPower = isHotline && lowPowerEl && lowPowerEl.checked;
  const note = document.getElementById('stepModalNote').value.trim();

  if (!lowPower && !pendingStepFile) {
    showToast('กรุณาแนบไฟล์ก่อนยืนยันขั้นตอน', 'error');
    return;
  }

  let finalNote = note;
  if (lowPower) finalNote = (note ? note + ' | ' : '') + 'งานแรงต่ำ';

  document.getElementById('stepModalSubmitBtn').disabled = true;
  document.getElementById('stepModalSubmitText').textContent = 'กำลังบันทึก...';
  document.getElementById('stepModalSpinner').style.display = 'inline-block';
  doStepUpdate(pendingStepKey, finalNote, lowPower);
}

async function doStepUpdate(stepKey, note, lowPowerJob) {
  try {
    let fileUrl = '';
    if (pendingStepFile) {
      const b64 = await fileToBase64(pendingStepFile);
      const upload = await gasAPI('uploadFile', {
        base64Data: b64,
        fileName: pendingStepFile.name,
        mimeType: pendingStepFile.type,
        subFolder: stepKey
      });
      if (!upload.success) throw new Error(upload.error || 'อัปโหลดไฟล์ไม่สำเร็จ');
      fileUrl = upload.url;
    }

    const res = await gasAPI('updateStep', {
      payload: {
        jobId: selectedJob.id,
        stepKey,
        value: 'YES',
        note,
        fileUrl,
        lowPowerJob: !!lowPowerJob,
        auth: currentAuth
      }
    });
    closeStepUpdateModal();
    if (!res.success) throw new Error(res.error || 'บันทึกไม่สำเร็จ');

    await bootstrapApp();
    selectedJob = allJobs.find(job => job.id === selectedJob.id);
    pendingStepFile = null;
    pendingStepKey = null;
    renderSheetHeader();
    renderStepTab();
    showToast('บันทึกขั้นตอนเรียบร้อย', 'success');
  } catch (e) {
    resetStepModalSubmitBtn();
    showToast(e.message, 'error');
  }
}

function canEditStep(step, index, job) {
  if (!currentUser) return false;
  if (step.locked && !currentUser.isAdmin) return false;
  if (!(currentUser.isAdmin || currentUser.allowedSteps.includes('ALL') || currentUser.allowedSteps.includes(step.key))) return false;
  return step.value !== 'YES' || currentUser.isAdmin;
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

function showFilePreview(event, url, thumbUrl) {
  const preview = document.getElementById('fileHoverPreview');
  if (!preview || !url) return;
  const imgSrc = thumbUrl || '';
  preview.innerHTML = `<div class="file-hover-card">
    <div class="file-hover-title">📎 ไฟล์แนบ</div>
    ${imgSrc
      ? `<img src="${imgSrc}" alt="preview" style="width:100%;max-height:220px;object-fit:contain;background:#f8fafc;display:block;"
           onerror="this.style.display='none';this.nextElementSibling.style.display='block'">`
      : ''}
    <div style="${imgSrc ? 'display:none;' : ''}padding:16px;text-align:center;font-size:12px;color:#667085">
      ไม่สามารถแสดง preview ได้<br>
      <a href="${url}" target="_blank" style="color:#365f91">คลิกเพื่อเปิดไฟล์ ↗</a>
    </div>
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