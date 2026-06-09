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

function renderFilterChips() {
  const filtered = getFilteredJobs();
  const host = document.getElementById('filterRow');
  const chips = [{ key: 'all', label: 'ทั้งหมด', count: filtered.length }].concat(
    (appMeta.stepConfig || []).map(step => ({
      key: step.key,
      label: step.label,
      count: filtered.filter(job => {
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

function toggleFilterPanel() {
  document.getElementById('filterPanel').classList.toggle('open');
}

function clearAdvFilter() {
  document.getElementById('f-transformer-filter').value = '';
  renderList();
}

function renderList() {
  const jobs = getFilteredJobs();
  updateSummary(jobs);
  renderFilterChips();
  document.getElementById('listCount').textContent = jobs.length + ' งาน';
  document.getElementById('jobList').innerHTML = jobs.length
    ? jobs.map((job, index) => jobCardHTML(job, index)).join('')
    : `<div class="empty"><p>ไม่พบรายการงาน</p></div>`;
}

function getStepSummary(job) {
  const done = job.steps.filter(step => step.value === 'YES').length;
  const total = job.steps.length;
  return `${done}/${total}`;
}

function getCurrentStepLabel(job) {
  const nextStep = job.steps.find(step => step.value !== 'YES');
  return nextStep ? nextStep.label : 'ปิดงานครบแล้ว';
}

function jobCardHTML(job, index) {
  const bars = job.steps.map((step, stepIndex) => {
    const active = step.value !== 'YES' && stepIndex === job.currentStepIndex;
    return `<div class="prog-seg ${step.value === 'YES' ? 'done' : active ? 'active' : ''}"></div>`;
  }).join('');

  return `<div class="job-card" onclick="openSheet('${job.id}')">
    <div class="job-order">${index + 1}</div>
    <div class="job-header">
      <div>
        <div class="job-id">${job.id}</div>
        <div class="job-name">${job.detail.peaNo || job.detail.wbs}</div>
      </div>
      <span class="status-badge ${job.isComplete ? 's5' : 's1'}">${getStepSummary(job)}</span>
    </div>
    <div class="job-meta">
      <span>${job.detail.description || '-'}</span>
      <span>${job.detail.supervisor || '-'}</span>
      <span>${job.transformer || 'Transformer -'}</span>
    </div>
    <div class="current-step-label">
      <span class="current-step-tag">ขั้นตอนปัจจุบัน</span>
      <strong>${getCurrentStepLabel(job)}</strong>
    </div>
    <div><div class="prog-bar">${bars}</div></div>
  </div>`;
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
    ['ลำดับ', 'WBS', 'PEA NO หม้อแปลง', 'คำอธิบาย', 'ผู้ควบคุมงาน', 'สถานะปัจจุบัน', 'Transformer'],
    jobs.map((job, index) => [
      index + 1,
      job.detail.wbs,
      job.detail.peaNo,
      job.detail.description,
      job.detail.supervisor,
      getCurrentStepLabel(job),
      job.transformer
    ])
  );
}
