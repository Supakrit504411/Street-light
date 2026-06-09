function renderDash() {
  const selectedStepKey = document.getElementById('dashStepFilter') ? document.getElementById('dashStepFilter').value : 'all';
  const search = (document.getElementById('dashSearchInput') ? document.getElementById('dashSearchInput').value : '').toLowerCase().trim();
  const filteredJobs = allJobs.filter(job => {
    if (selectedStepKey !== 'all') {
      const step = job.steps.find(item => item.key === selectedStepKey);
      if (!step || step.value !== 'YES') return false;
    }
    if (!search) return true;
    const hay = [job.detail.wbs, job.detail.description, job.detail.supervisor, job.id].join(' ').toLowerCase();
    return hay.includes(search);
  });
  const total = filteredJobs.length || 1;

  document.getElementById('dashTotal').textContent = filteredJobs.length;
  document.getElementById('dashDone').textContent = filteredJobs.filter(job => job.isComplete).length;
  document.getElementById('dashOpen').textContent = filteredJobs.filter(job => !job.isComplete).length;

  document.getElementById('dashStatusList').innerHTML = (appMeta.stepConfig || []).map((step, index) => {
    const cnt = filteredJobs.filter(job => {
      const found = job.steps.find(item => item.key === step.key);
      return found && found.value === 'YES';
    }).length;
    const pct = Math.round((cnt / total) * 100);
    return `<div class="status-row compact">
      <div class="status-dot" style="background:${STEP_COLORS[index]}"></div>
      <div class="status-label-block">
        <div class="status-title">${step.label}</div>
        <div class="status-pct">${pct}%</div>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${STEP_COLORS[index]}"></div></div>
      <div class="status-num">${cnt}</div>
    </div>`;
  }).join('');

  document.getElementById('recentList').innerHTML = filteredJobs.length
    ? `<div class="table-wrap"><table class="dash-table">
        <thead><tr><th>#</th><th>WBS</th><th>คำอธิบาย</th><th>สถานะล่าสุด</th><th>เวลา</th></tr></thead>
        <tbody>${filteredJobs.slice(0, 50).map((job, index) => `
          <tr onclick="openSheet('${job.id}')">
            <td>${index + 1}</td>
            <td>${job.detail.wbs || '-'}</td>
            <td>${job.detail.description || '-'}</td>
            <td>${job.latestStep ? job.latestStep.label : '-'}</td>
            <td>${job.updatedAt || '-'}</td>
          </tr>`).join('')}</tbody>
      </table></div>`
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
    const hay = [job.id, job.detail.wbs, job.detail.description, job.detail.supervisor, job.detail.systemStatus, job.detail.statusText].join(' ').toLowerCase();
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
    ? jobs.map((job, index) => {
        const latest = job.latestStep;
        return `<tr onclick="openSheet('${job.id}')">
          <td>${index + 1}</td>
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
    : '<tr><td colspan="9" class="kpi-empty">ไม่พบข้อมูล</td></tr>';
}

function exportDashCsv() {
  const rows = allJobs.map((job, index) => [
    index + 1,
    job.detail.wbs,
    job.detail.description,
    job.latestStep ? job.latestStep.label : '-',
    job.updatedAt || '-'
  ]);
  exportRowsAsCsv('pea-dashboard.csv', ['ลำดับ', 'WBS', 'คำอธิบาย', 'สถานะล่าสุด', 'เวลา'], rows);
}

function exportKpiCsv() {
  const jobs = getKpiFilteredJobs();
  exportRowsAsCsv(
    'pea-kpi.csv',
    ['ลำดับ', 'WBS', 'คำอธิบาย', 'ผู้ควบคุมงาน', 'สถานะระบบ', 'สถานะ', '%เบิกพัสดุ', '%เบิก ค่าแรง', 'สถานะล่าสุด', 'ไฟล์แนบ', 'เวลา'],
    jobs.map((job, index) => [
      index + 1,
      job.detail.wbs,
      job.detail.description,
      job.detail.supervisor,
      job.detail.systemStatus,
      job.detail.statusText,
      job.detail.materialPct,
      job.detail.withdrawPct,
      job.latestStep ? job.latestStep.label : '-',
      job.latestFileUrl || '',
      job.updatedAt || '-'
    ])
  );
}
