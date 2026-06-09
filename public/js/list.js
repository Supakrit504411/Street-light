function renderFilterChips() {
  const host = document.getElementById('filterRow');
  const chips = [{ key: 'all', label: 'ทั้งหมด' }].concat(
    (appMeta.stepConfig || []).map(step => ({ key: step.key, label: step.label }))
  );
  host.innerHTML = chips.map((chip, index) =>
    `<div class="chip ${index === 0 ? 'active' : ''}" onclick="setFilter('${chip.key}', this)">${chip.label}</div>`
  ).join('');
}

function setFilter(val, el) {
  currentFilter = val;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
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
  const q = (document.getElementById('searchInput').value || '').toLowerCase().trim();
  const transformerFilter = document.getElementById('f-transformer-filter').value.trim().toUpperCase();

  const jobs = allJobs.filter(job => {
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

  document.getElementById('listCount').textContent = jobs.length + ' งาน';
  document.getElementById('jobList').innerHTML = jobs.length
    ? jobs.map(jobCardHTML).join('')
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

function jobCardHTML(job) {
  const bars = job.steps.map((step, index) => {
    const active = step.value !== 'YES' && index === job.currentStepIndex;
    return `<div class="prog-seg ${step.value === 'YES' ? 'done' : active ? 'active' : ''}"></div>`;
  }).join('');

  return `<div class="job-card" onclick="openSheet('${job.id}')">
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
    <div class="current-step-label">ขั้นตอนปัจจุบัน: ${getCurrentStepLabel(job)}</div>
    <div><div class="prog-bar">${bars}</div></div>
  </div>`;
}

function updateSummary() {
  const total = allJobs.length;
  const done = allJobs.filter(job => job.isComplete).length;
  const active = total - done;
  const thisMonth = new Date().getMonth() + 1;

  document.getElementById('cnt-total').textContent = total;
  document.getElementById('cnt-active').textContent = active;
  document.getElementById('cnt-done').textContent = done;
  document.getElementById('cnt-today').textContent = allJobs.filter(job => String(job.detail.month || '').includes(String(thisMonth))).length;
}
