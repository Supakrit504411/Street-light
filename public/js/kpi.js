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
        <div class="status-pct">${cnt} งาน · ${pct}%</div>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${STEP_COLORS[index]}"></div></div>
    </div>`;
  }).join('');

  document.getElementById('recentList').innerHTML = filteredJobs.length
    ? `<div class="table-wrap"><table class="dash-table">
      <thead><tr><th>ลำดับ</th><th>WBS</th><th>คำอธิบาย</th><th>ผู้ควบคุมงาน</th><th>สถานะล่าสุด</th><th>เวลา</th></tr></thead>
      <tbody>${filteredJobs.slice(0, 50).map((job, index) => `
        <tr onclick="openSheet('${job.id}')">
          <td>${index + 1}</td>
          <td>${job.detail.wbs || '-'}</td>
          <td>${job.detail.description || '-'}</td>
          <td>${job.detail.supervisor || '-'}</td>
          <td>${job.latestStep ? job.latestStep.label : '-'}</td>
          <td>${job.updatedAt || '-'}</td>
        </tr>`).join('')}</tbody>
    </table></div>`
    : '<div style="padding:16px;text-align:center;color:#667085;font-size:13px">ยังไม่มีข้อมูลตามตัวกรอง</div>';
}

function exportDashCsv() {
  const rows = allJobs.map((job, index) => [
    index + 1,
    job.detail.wbs,
    job.detail.description,
    job.detail.supervisor,
    job.latestStep ? job.latestStep.label : '-',
    job.updatedAt || '-'
  ]);
  exportRowsAsCsv('pea-dashboard.csv', ['ลำดับ', 'WBS', 'คำอธิบาย', 'ผู้ควบคุมงาน', 'สถานะล่าสุด', 'เวลา'], rows);
}
