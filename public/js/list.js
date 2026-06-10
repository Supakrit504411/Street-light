function getFilteredJobs() {
  const q = (document.getElementById('searchInput').value || '').toLowerCase().trim();
  const transformerFilter = document.getElementById('f-transformer-filter').value.trim().toUpperCase();

  return allJobs.filter(job => {
    if (currentFilter !== 'all') {
      const step = job.steps.find(item => item.key === currentFilter);
      if (!step || step.value !== 'YES') return false;
    }

    const hay = [
      job.id,
      job.detail.wbs,
      job.detail.peaNo,
      job.detail.description,
      job.detail.supervisor,
      job.detail.systemStatus,
      job.detail.statusText
    ].join(' ').toLowerCase();

    if (q && !hay.includes(q)) return false;
    if (transformerFilter && String(job.transformer || '').toUpperCase() !== transformerFilter) return false;
    return true;
  });
}

function formatNumber(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return value || '-';
  return num.toFixed(2).replace(/\.00$/, '');
}

function renderFilterChips() {
  const baseJobs = allJobs.filter(job => {
    const q = (document.getElementById('searchInput').value || '').toLowerCase().trim();
    const transformerFilter = document.getElementById('f-transformer-filter').value.trim().toUpperCase();
    const hay = [
      job.id,
      job.detail.wbs,
      job.detail.peaNo,
      job.detail.description,
      job.detail.supervisor,
      job.detail.systemStatus,
      job.detail.statusText
    ].join(' ').toLowerCase();
    if (q && !hay.includes(q)) return false;
    if (transformerFilter && String(job.transformer || '').toUpperCase() !== transformerFilter) return false;
    return true;
  });

  const host = document.getElementById('filterRow');
  const chips = [{ key: 'all', label: 'ทั้งหมด', count: baseJobs.length }].concat(
    (appMeta.stepConfig || []).map(step => ({
      key: step.key,
      label: step.label,
      count: baseJobs.filter(job => {
        const found = job.steps.find(item => item.key === step.key);
        return found && found.value === 'YES';
      }).length
    }))
  );

  host.innerHTML = chips.map(chip =>
    `<div class="chip ${currentFilter === chip.key ? 'active' : ''}" onclick="setFilter('${chip.key}', this)">
      <span>${chip.label}</span>
      <strong>${chip.count}</strong>
    </div>`
  ).join('');
}

function setFilter(val, el) {
  currentFilter = val;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  if (el) el.classList.add('active');
  renderList();
}

function renderList() {
  const jobs = getFilteredJobs();
  updateSummary(jobs);
  renderFilterChips();
  document.getElementById('listCount').textContent = jobs.length + ' งาน';
  document.getElementById('jobList').innerHTML = jobs.length
    ? jobs.map((job, index) => jobRowHTML(job, index)).join('')
    : '<tr><td colspan="9" class="kpi-empty">ไม่พบรายการงาน</td></tr>';
}

function jobRowHTML(job, index) {
  const latest = job.latestStep;
  const fileCell = job.latestFileUrl
    ? `<a href="${job.latestFileUrl}" target="_blank" class="file-link"
         onmouseenter="showFilePreview(event,'${job.latestFileUrl}')"
         onmousemove="moveFilePreview(event)"
         onmouseleave="hideFilePreview()">
         📎 ดูไฟล์
       </a>`
    : '<span class="muted-inline">ไม่มีไฟล์</span>';

  return `<tr onclick="openSheet('${job.id}')">
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
  </tr>`;
}

function updateSummary(jobs = allJobs) {
  const total = jobs.length;
  const done = jobs.filter(job => job.isComplete).length;
  const active = total - done;
  document.getElementById('cnt-total').textContent = total;
  document.getElementById('cnt-active').textContent = active;
  document.getElementById('cnt-done').textContent = done;
}

function exportListCsv() {
  const jobs = getFilteredJobs();
  exportRowsAsCsv(
    'pea-list.csv',
    ['ลำดับ', 'WBS', 'คำอธิบาย', 'ผู้ควบคุมงาน', 'สถานะระบบ', 'สถานะ', '%เบิกพัสดุ', '%เบิก ค่าแรง', 'สถานะล่าสุด', 'ไฟล์แนบ', 'เวลา'],
    jobs.map((job, index) => [
      index + 1,
      job.detail.wbs,
      job.detail.description,
      job.detail.supervisor,
      job.detail.systemStatus,
      job.detail.statusText,
      formatNumber(job.detail.materialPct),
      formatNumber(job.detail.withdrawPct),
      job.latestStep ? job.latestStep.label : '-',
      job.latestFileUrl || '',
      job.updatedAt || '-'
    ])
  );
}
