function renderDash() {
  const total = allJobs.length || 1;
  document.getElementById('dashStatusList').innerHTML = (appMeta.stepConfig || []).map((step, index) => {
    const cnt = allJobs.filter(job => {
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

  const recent = [...allJobs].slice(-8).reverse();
  document.getElementById('recentList').innerHTML = recent.length
    ? recent.map(job => `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;border-bottom:1px solid rgba(0,0,0,.05)">
        <div><div style="font-size:13px;font-weight:500">${job.detail.peaNo || job.id}</div>
        <div style="font-size:11px;color:#9ca3af">${job.id} | ${getCurrentStepLabel(job)}</div></div>
        <span class="status-badge ${job.isComplete ? 's5' : 's1'}">${getStepSummary(job)}</span>
      </div>`).join('')
    : '<div style="padding:16px;text-align:center;color:#999;font-size:13px">ยังไม่มีงาน</div>';
}

function renderKPI() {
  const total = allJobs.length;
  const done = allJobs.filter(job => job.isComplete).length;
  const donePct = total ? Math.round((done / total) * 100) : 0;
  const active = total - done;
  const transformerPEA = allJobs.filter(job => job.transformer === 'PEA').length;
  const transformerCUS = allJobs.filter(job => job.transformer === 'CUS').length;

  document.getElementById('kpi-total').textContent = total;
  document.getElementById('kpi-done').textContent = done;
  document.getElementById('kpi-done-pct').textContent = donePct + '% ของทั้งหมด';
  document.getElementById('kpi-overdue').textContent = active;
  document.getElementById('kpi-this-month').textContent = transformerPEA + transformerCUS;
  document.getElementById('kpi-month-label').textContent = `PEA ${transformerPEA} | CUS ${transformerCUS}`;
  document.getElementById('overdue-badge').textContent = active;

  document.getElementById('overdueList').innerHTML = allJobs
    .filter(job => !job.isComplete)
    .slice(0, 10)
    .map(job => `<div class="overdue-item" onclick="openSheet('${job.id}')">
      <div>
        <div class="overdue-name">${job.detail.peaNo || job.id}</div>
        <div class="overdue-meta">${job.id} | ${getCurrentStepLabel(job)}</div>
      </div>
      <div class="overdue-days">${getStepSummary(job)}</div>
    </div>`).join('') || '<div style="padding:16px;text-align:center;color:#999;font-size:13px">ไม่มีงานค้าง</div>';

  const people = {};
  allJobs.forEach(job => {
    const name = job.detail.supervisor || '(ไม่ระบุ)';
    if (!people[name]) people[name] = { total: 0, done: 0 };
    people[name].total++;
    if (job.isComplete) people[name].done++;
  });
  const rows = Object.entries(people).sort((a, b) => b[1].total - a[1].total);
  document.getElementById('assigneeList').innerHTML = rows.map(([name, value]) => {
    const pct = value.total ? Math.round((value.done / value.total) * 100) : 0;
    return `<div class="assignee-row">
      <div class="assignee-avatar">${name.slice(0, 2)}</div>
      <div style="flex:1">
        <div class="assignee-name">${name}</div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:3px">
          <div class="bar-track" style="flex:1"><div class="bar-fill" style="width:${pct}%;background:var(--pea)"></div></div>
          <span style="font-size:10px;color:var(--muted);white-space:nowrap">${pct}%</span>
        </div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div class="assignee-done">${value.done}/${value.total}</div>
        <div class="assignee-count" style="margin-top:2px">งานทั้งหมด</div>
      </div>
    </div>`;
  }).join('') || '<div style="padding:16px;text-align:center;color:#999;font-size:13px">ยังไม่มีข้อมูล</div>';
}
