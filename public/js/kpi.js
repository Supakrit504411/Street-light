function renderDash() {
  const selectedStepKey = document.getElementById('dashStepFilter') ? document.getElementById('dashStepFilter').value : 'all';
  const filteredJobs = selectedStepKey === 'all'
    ? allJobs
    : allJobs.filter(job => {
        const step = job.steps.find(item => item.key === selectedStepKey);
        return step && step.value === 'YES';
      });
  const total = filteredJobs.length || 1;

  document.getElementById('dashStatusList').innerHTML = (appMeta.stepConfig || []).map((step, index) => {
    const cnt = filteredJobs.filter(job => {
      const found = job.steps.find(item => item.key === step.key);
      return found && found.value === 'YES';
    }).length;
    const pct = Math.round((cnt / total) * 100);
    return `<div class="status-row">
      <div class="status-dot" style="background:${STEP_COLORS[index]}"></div>
      <div style="flex:1;font-size:13px">${step.label}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${STEP_COLORS[index]}"></div></div>
      <div class="status-num">${cnt}</div>
    </div>`;
  }).join('');

  document.getElementById('recentList').innerHTML = filteredJobs.length
    ? filteredJobs.slice(0, 12).map(job => `
      <div class="dash-mini-card" onclick="openSheet('${job.id}')">
        <div class="dash-mini-title">${job.detail.wbs || job.id}</div>
        <div class="dash-mini-sub">${job.detail.description || '-'}</div>
        <div class="dash-mini-foot">${job.latestStep ? job.latestStep.label : '-'} | ${job.updatedAt || '-'}</div>
      </div>`).join('')
    : '<div style="padding:16px;text-align:center;color:#999;font-size:13px">ยังไม่มีข้อมูลตามตัวกรอง</div>';
}

function getKpiFilteredJobs() {
  const stepKey = document.getElementById('kpiStepFilter') ? document.getElementById('kpiStepFilter').value : 'all';
  const transformer = document.getElementById('kpiTransformerFilter') ? document.getElementById('kpiTransformerFilter').value : 'all';
  const q = (document.getElementById('kpiSearchInput') ? document.getElementById('kpiSearchInput').value : '').toLowerCase().trim();

  return allJobs.filter(job => {
    if (stepKey !== 'all') {
      const step = job.steps.find(item => item.key === stepKey);
      if (!step || step.value !== 'YES') return false;
    }
    if (transformer !== 'all' && String(job.transformer || '') !== transformer) return false;
    const hay = [
      job.id,
      job.detail.wbs,
      job.detail.description,
      job.detail.supervisor,
      job.detail.systemStatus,
      job.detail.statusText
    ].join(' ').toLowerCase();
    if (q && !hay.includes(q)) return false;
    return true;
  });
}

function renderKPI() {
  const jobs = getKpiFilteredJobs();
  const total = jobs.length;
  const done = jobs.filter(job => job.isComplete).length;
  const open = total - done;
  const pea = jobs.filter(job => job.transformer === 'PEA').length;

  document.getElementById('kpi-total').textContent = total;
  document.getElementById('kpi-done').textContent = done;
  document.getElementById('kpi-done-pct').textContent = total ? Math.round((done / total) * 100) + '% ของตัวกรอง' : '0% ของตัวกรอง';
  document.getElementById('kpi-overdue').textContent = open;
  document.getElementById('kpi-this-month').textContent = pea;
  document.getElementById('kpi-month-label').textContent = `CUS ${total - pea}`;

  document.getElementById('kpiTableBody').innerHTML = jobs.length
    ? jobs.map(job => {
        const latest = job.latestStep;
        return `<tr onclick="openSheet('${job.id}')">
          <td>${job.detail.wbs || '-'}</td>
          <td>${job.detail.description || '-'}</td>
          <td>${job.detail.supervisor || '-'}</td>
          <td>${job.detail.systemStatus || '-'}</td>
          <td>${job.detail.statusText || '-'}</td>
          <td>${job.detail.materialPct || '-'}</td>
          <td>${job.detail.withdrawPct || '-'}</td>
          <td>
            <div class="kpi-latest-step">${latest ? latest.label : '-'}</div>
            <div class="kpi-latest-meta">${job.updatedAt || '-'}</div>
            ${job.latestFileUrl ? `<a href="${job.latestFileUrl}" target="_blank">ไฟล์แนบ</a>` : '<span class="muted-inline">ไม่มีไฟล์</span>'}
          </td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="8" class="kpi-empty">ไม่พบข้อมูล</td></tr>';
}
