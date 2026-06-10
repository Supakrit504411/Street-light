// ============================================================
// list.js — clean version (ลบโค้ดซ้ำออกแล้ว)
// ============================================================

function getActiveStepKey(job) {
  for (let i = 0; i < job.steps.length; i++) {
    if (job.steps[i].value !== 'YES') return job.steps[i].key;
  }
  return '__complete__';
}

function populateStatusFilter() {
  const el = document.getElementById('f-status-filter');
  if (!el) return;
  const current = el.value;
  const values = [...new Set(allJobs.map(j => j.detail.statusText).filter(Boolean))].sort();
  el.innerHTML = '<option value="">สถานะ (ทั้งหมด)</option>' +
    values.map(v => `<option value="${v}" ${v === current ? 'selected' : ''}>${v}</option>`).join('');
}

function formatNumber(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return value || '-';
  return num.toFixed(2).replace(/\.00$/, '');
}

function renderFilterChips() {
  const q = (document.getElementById('searchInput').value || '').toLowerCase().trim();
  const transformerFilter = document.getElementById('f-transformer-filter').value.trim().toUpperCase();
  const statusFilter = document.getElementById('f-status-filter') ? document.getElementById('f-status-filter').value.trim() : '';

  const baseJobs = allJobs.filter(job => {
    const hay = [job.id, job.detail.wbs, job.detail.peaNo, job.detail.description,
      job.detail.supervisor, job.detail.systemStatus, job.detail.statusText].join(' ').toLowerCase();
    if (q && !hay.includes(q)) return false;
    if (transformerFilter && String(job.transformer || '').toUpperCase() !== transformerFilter) return false;
    if (statusFilter && job.detail.statusText !== statusFilter) return false;
    return true;
  });

  const chips = [{ key: 'all', label: 'ทั้งหมด', count: baseJobs.length }].concat(
    (appMeta.stepConfig || []).map(step => ({
      key: step.key,
      label: step.label,
      count: baseJobs.filter(job => getActiveStepKey(job) === step.key).length
    }))
  );

  document.getElementById('filterRow').innerHTML = chips.map(chip =>
    `<div class="chip ${currentFilter === chip.key ? 'active' : ''}" onclick="setFilter('${chip.key}', this)">
      <span>${chip.label}</span><strong>${chip.count}</strong>
    </div>`
  ).join('');
}

function getFilteredJobs() {
  const q = (document.getElementById('searchInput').value || '').toLowerCase().trim();
  const transformerFilter = document.getElementById('f-transformer-filter').value.trim().toUpperCase();
  const statusFilter = document.getElementById('f-status-filter') ? document.getElementById('f-status-filter').value.trim() : '';

  return allJobs.filter(job => {
    if (currentFilter !== 'all') {
      if (getActiveStepKey(job) !== currentFilter) return false;
    }
    const hay = [job.id, job.detail.wbs, job.detail.peaNo, job.detail.description,
      job.detail.supervisor, job.detail.systemStatus, job.detail.statusText].join(' ').toLowerCase();
    if (q && !hay.includes(q)) return false;
    if (transformerFilter && String(job.transformer || '').toUpperCase() !== transformerFilter) return false;
    if (statusFilter && job.detail.statusText !== statusFilter) return false;
    return true;
  });
}

function setFilter(val, el) {
  currentFilter = val;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  if (el) el.classList.add('active');
  renderList();
}

function renderList() {
  populateStatusFilter();
  const jobs = getFilteredJobs();
  updateSummary(jobs);
  renderFilterChips();
  document.getElementById('listCount').textContent = jobs.length + ' งาน';
  document.getElementById('jobList').innerHTML = jobs.length
    ? jobs.map((job, index) => jobRowHTML(job, index)).join('')
    : '<tr><td colspan="10" class="kpi-empty">ไม่พบรายการงาน</td></tr>';
}

function jobRowHTML(job, index) {
  const latest = job.latestStep;

  const fileCell = job.latestFileUrl
    ? (() => {
        const m = job.latestFileUrl.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
        const thumb = m ? `https://drive.google.com/thumbnail?id=${m[1]}&sz=w400` : '';
        return `<a href="${job.latestFileUrl}" target="_blank" class="file-link"
          onclick="event.stopPropagation()"
          onmouseenter="showFilePreview(event,'${job.latestFileUrl}','${thumb}')"
          onmousemove="moveFilePreview(event)"
          onmouseleave="hideFilePreview()">📎 ดูไฟล์</a>`;
      })()
    : '<span class="muted-inline">ไม่มีไฟล์</span>';

  const latLong = job.latLong || '';
  const navBtn = latLong
    ? `<button class="nav-btn" title="นำทาง" onclick="event.stopPropagation();openNavigation('${latLong}')">🧭</button>`
    : `<button class="nav-btn" disabled title="ไม่มีพิกัด">📍</button>`;

  return `<tr>
    <td>${index + 1}</td>
    <td>${job.detail.wbs || '-'}</td>
    <td>${job.detail.description || '-'}</td>
    <td>${job.detail.supervisor || '-'}</td>
    <td>${job.detail.systemStatus || '-'}</td>
    <td>${job.detail.statusText || '-'}</td>
    <td>${formatNumber(job.detail.materialPct)}</td>
    <td>${formatNumber(job.detail.withdrawPct)}</td>
    <td>
      <div class="kpi-latest-step"><span class="current-step-tag">ล่าสุด</span> ${latest ? latest.label : '-'}</div>
      <div class="kpi-latest-meta">${job.updatedAt || '-'}</div>
      ${fileCell}
    </td>
    <td class="action-cell">
      <button class="update-btn" onclick="event.stopPropagation();openSheet('${job.id}')">อัปเดต</button>
      ${navBtn}
    </td>
  </tr>`;
}

function openNavigation(latLong) {
  const cleaned = latLong.replace(/\s+/, ',').trim();
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${cleaned}`, '_blank');
}

function updateSummary(jobs = allJobs) {
  const total  = jobs.length;
  const done   = jobs.filter(job => job.isComplete).length;
  const active = total - done;
  document.getElementById('cnt-total').textContent  = total;
  document.getElementById('cnt-active').textContent = active;
  document.getElementById('cnt-done').textContent   = done;
}

function exportListCsv() {
  const jobs = getFilteredJobs();
  exportRowsAsCsv(
    'pea-list.csv',
    ['ลำดับ','WBS','คำอธิบาย','ผู้ควบคุมงาน','สถานะระบบ','สถานะ','%เบิกพัสดุ','%เบิกค่าแรง','สถานะล่าสุด','ไฟล์แนบ','เวลา'],
    jobs.map((job, i) => [
      i+1, job.detail.wbs, job.detail.description, job.detail.supervisor,
      job.detail.systemStatus, job.detail.statusText,
      formatNumber(job.detail.materialPct), formatNumber(job.detail.withdrawPct),
      job.latestStep ? job.latestStep.label : '-',
      job.latestFileUrl || '', job.updatedAt || '-'
    ])
  );
}