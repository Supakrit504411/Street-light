// ============================================================
// list.js — Job list, filter, search, summary
// แก้ filter หรือ card UI ที่นี่
// ============================================================

// ── Filter Chips ──
function setFilter(val, el) {
  currentFilter = val;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderList();
}

// ── Advanced Filter Panel ──
function toggleFilterPanel() {
  document.getElementById('filterPanel').classList.toggle('open');
}

function populateAssigneeDropdown() {
  const sel     = document.getElementById('f-assignee-filter');
  const current = sel.value;
  const names   = [...new Set(allJobs.map(j => j.assignee).filter(Boolean))].sort();
  sel.innerHTML = '<option value="">— ทั้งหมด —</option>' +
    names.map(n => `<option value="${n}" ${n === current ? 'selected' : ''}>${n}</option>`).join('');
}

function clearAdvFilter() {
  document.getElementById('f-assignee-filter').value = '';
  document.getElementById('f-date-from').value = '';
  document.getElementById('f-date-to').value   = '';
  document.getElementById('advFilterBtn').classList.remove('has-filter');
  document.getElementById('advFilterLabel').textContent = 'กรอง';
  renderList();
}

// parse "dd/MM/yyyy" → Date
function parseThaiDate(str) {
  if (!str) return null;
  const [d, m, y] = str.split('/');
  return new Date(+y, +m - 1, +d);
}

// ── Render List ──
function renderList() {
  const q         = (document.getElementById('searchInput').value || '').toLowerCase().trim();
  const assigneeF = document.getElementById('f-assignee-filter').value;
  const dateFrom  = document.getElementById('f-date-from').value;
  const dateTo    = document.getElementById('f-date-to').value;

  const hasAdv = assigneeF || dateFrom || dateTo;
  document.getElementById('advFilterBtn').classList.toggle('has-filter', !!hasAdv);
  document.getElementById('advFilterLabel').textContent = hasAdv ? 'กรองอยู่ ✕' : 'กรอง';

  const jobs = allJobs.filter(j => {
    if (currentFilter !== 'all' && j.status !== currentFilter) return false;
    if (q && !(j.name.toLowerCase().includes(q) || j.id.toLowerCase().includes(q)
             || j.assignee.toLowerCase().includes(q) || j.phone.includes(q))) return false;
    if (assigneeF && j.assignee !== assigneeF) return false;
    const jDate = parseThaiDate(j.date);
    if (dateFrom && jDate && jDate < new Date(dateFrom)) return false;
    if (dateTo   && jDate) {
      const to = new Date(dateTo); to.setHours(23,59,59);
      if (jDate > to) return false;
    }
    return true;
  });

  document.getElementById('listCount').textContent = jobs.length + ' งาน';
  const el = document.getElementById('jobList');
  el.innerHTML = jobs.length ? jobs.map(jobCardHTML).join('') :
    `<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg><p>ไม่พบรายการงาน</p></div>`;
}

function jobCardHTML(j) {
  const si   = STATUSES.indexOf(j.status);
  const sc   = si >= 0 ? STATUS_CLASS[si] : 's0';
  const bars = STATUSES.map((_,i) =>
    `<div class="prog-seg ${i<si?'done':i===si?'active':''}"></div>`).join('');
  const lbls = STATUSES.map((s,i) => {
    const sh = s.replace('ติดตั้ง','').replace('ตรวจมาตรฐาน','ตรวจ');
    return `<div class="prog-lbl ${i<si?'done':i===si?'active':''}">${sh}</div>`;
  }).join('');
  return `<div class="job-card" onclick="openSheet('${j.id}')">
    <div class="job-header">
      <div><div class="job-id">${j.id}</div><div class="job-name">${j.name}</div></div>
      <span class="status-badge ${sc}">${j.status}</span>
    </div>
    <div class="job-meta">
      <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.27 12 19.79 19.79 0 0 1 1.11 3.41 2 2 0 0 1 3.09 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z"/></svg>${j.phone}</span>
      <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${j.date}</span>
      ${j.assignee?`<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>${j.assignee}</span>`:''}
    </div>
    <div><div class="prog-bar">${bars}</div><div class="prog-labels">${lbls}</div></div>
  </div>`;
}

// ── Summary Counters ──
function updateSummary() {
  const today    = new Date();
  const todayStr = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`;
  document.getElementById('cnt-total').textContent  = allJobs.length;
  document.getElementById('cnt-active').textContent = allJobs.filter(j => j.status !== 'จ่ายไฟ').length;
  document.getElementById('cnt-done').textContent   = allJobs.filter(j => j.status === 'จ่ายไฟ').length;
  document.getElementById('cnt-today').textContent  = allJobs.filter(j => j.date === todayStr).length;
}