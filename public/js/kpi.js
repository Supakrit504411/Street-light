// ============================================================
// kpi.js — Dashboard & KPI
// แก้ KPI metrics หรือเพิ่ม chart ที่นี่
// ============================================================

function renderDash() {
  const total = allJobs.length || 1;
  document.getElementById('dashStatusList').innerHTML = STATUSES.map((s,i) => {
    const cnt = allJobs.filter(j => j.status === s).length;
    const pct = Math.round((cnt / total) * 100);
    return `<div class="status-row">
      <div class="status-dot" style="background:${STATUS_COLOR[i]}"></div>
      <div style="flex:1;font-size:13px">${s}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${STATUS_COLOR[i]}"></div></div>
      <div class="status-num">${cnt}</div></div>`;
  }).join('');

  const recent = [...allJobs].slice(-8).reverse();
  document.getElementById('recentList').innerHTML = !recent.length
    ? '<div style="padding:16px;text-align:center;color:#999;font-size:13px">ยังไม่มีงาน</div>'
    : recent.map(j => {
        const si = STATUSES.indexOf(j.status);
        const sc = si >= 0 ? STATUS_CLASS[si] : 's0';
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;border-bottom:1px solid rgba(0,0,0,.05)">
          <div><div style="font-size:13px;font-weight:500">${j.name}</div>
          <div style="font-size:11px;color:#9ca3af">${j.id} · ${j.date}</div></div>
          <span class="status-badge ${sc}">${j.status}</span></div>`;
      }).join('');
}

function renderKPI() {
  const now        = new Date();
  const thisMonth  = now.getMonth();
  const thisYear   = now.getFullYear();
  const total      = allJobs.length;
  const done       = allJobs.filter(j => j.status === 'จ่ายไฟ').length;
  const donePct    = total ? Math.round((done / total) * 100) : 0;
  const OVERDUE_DAYS = 7;

  const thisMonthJobs = allJobs.filter(j => {
    const d = parseThaiDate(j.date);
    return d && d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const overdueJobs = allJobs.filter(j => {
    if (j.status === 'จ่ายไฟ') return false;
    const d = parseThaiDate(j.date);
    if (!d) return false;
    return Math.floor((now - d) / 86400000) > OVERDUE_DAYS;
  }).sort((a,b) => parseThaiDate(a.date) - parseThaiDate(b.date));

  const assigneeMap = {};
  allJobs.forEach(j => {
    const name = j.assignee || '(ไม่ระบุ)';
    if (!assigneeMap[name]) assigneeMap[name] = { total:0, done:0 };
    assigneeMap[name].total++;
    if (j.status === 'จ่ายไฟ') assigneeMap[name].done++;
  });
  const assignees = Object.entries(assigneeMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a,b) => b.total - a.total);

  const thMonths = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

  // KPI Cards
  document.getElementById('kpi-total').textContent      = total;
  document.getElementById('kpi-done').textContent       = done;
  document.getElementById('kpi-done-pct').textContent   = donePct + '% ของทั้งหมด';
  document.getElementById('kpi-overdue').textContent    = overdueJobs.length;
  document.getElementById('kpi-this-month').textContent = thisMonthJobs.length;
  document.getElementById('kpi-month-label').textContent = thMonths[thisMonth] + ' ' + (thisYear + 543);
  document.getElementById('overdue-badge').textContent  = overdueJobs.length;

  // Overdue list
  document.getElementById('overdueList').innerHTML = !overdueJobs.length
    ? '<div style="padding:16px;text-align:center;color:#999;font-size:13px">✓ ไม่มีงานค้าง</div>'
    : overdueJobs.map(j => {
        const diffDays = Math.floor((now - parseThaiDate(j.date)) / 86400000);
        const si = STATUSES.indexOf(j.status);
        const sc = si >= 0 ? STATUS_CLASS[si] : 's0';
        return `<div class="overdue-item" onclick="openSheet('${j.id}')">
          <div>
            <div class="overdue-name">${j.name}</div>
            <div class="overdue-meta">${j.id} · <span class="status-badge ${sc}" style="font-size:9px">${j.status}</span></div>
          </div>
          <div class="overdue-days">+${diffDays} วัน</div></div>`;
      }).join('');

  // Assignee performance
  document.getElementById('assigneeList').innerHTML = !assignees.length
    ? '<div style="padding:16px;text-align:center;color:#999;font-size:13px">ยังไม่มีข้อมูล</div>'
    : assignees.map(a => {
        const pct      = a.total ? Math.round((a.done / a.total) * 100) : 0;
        const initials = a.name.replace('ช่าง','').trim().slice(0,2).toUpperCase();
        return `<div class="assignee-row">
          <div class="assignee-avatar">${initials}</div>
          <div style="flex:1">
            <div class="assignee-name">${a.name}</div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:3px">
              <div class="bar-track" style="flex:1"><div class="bar-fill" style="width:${pct}%;background:var(--pea)"></div></div>
              <span style="font-size:10px;color:var(--muted);white-space:nowrap">${pct}%</span>
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div class="assignee-done">${a.done}/${a.total}</div>
            <div class="assignee-count" style="margin-top:2px">งานทั้งหมด</div>
          </div></div>`;
      }).join('');
}