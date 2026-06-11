function switchTab(tab, el) {
  document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('page-' + tab).classList.add('active');
  if (tab === 'dash') renderDash();
  if (tab === 'kpi') renderKPI();
}

let toastTimer;
function showToast(msg, type, duration = 3200) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show ' + (type || '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, duration);
}

function showLoadingToast(msg = 'กำลังโหลดข้อมูล...') {
  const el = document.getElementById('toast');
  el.innerHTML = `<span class="toast-inline-spinner"></span>${msg}`;
  el.className = 'toast show loading';
  clearTimeout(toastTimer);
}

function hideToast() {
  const el = document.getElementById('toast');
  el.className = 'toast';
}

function openConfirm({ title, desc, summary, onConfirm }) {
  document.getElementById('dlgTitle').textContent = title;
  document.getElementById('dlgDesc').textContent = desc;
  document.getElementById('dlgSummary').innerHTML = summary;
  document.getElementById('dlgConfirmText').textContent = 'ยืนยันบันทึก';
  document.getElementById('dlgSpinner').style.display = 'none';
  document.getElementById('dlgConfirmBtn').disabled = false;
  confirmCallback = onConfirm;
  document.getElementById('confirmDialog').classList.add('open');
}

function closeConfirm() {
  document.getElementById('confirmDialog').classList.remove('open');
  confirmCallback = null;
}

function confirmAction() {
  if (!confirmCallback) return;
  document.getElementById('dlgConfirmBtn').disabled = true;
  document.getElementById('dlgConfirmText').textContent = 'กำลังบันทึก...';
  document.getElementById('dlgSpinner').style.display = 'inline-block';
  confirmCallback();
}

function setupKeyboardShortcuts() {
  const loginPass = document.getElementById('loginPass');
  const loginUser = document.getElementById('loginUser');
  [loginUser, loginPass].forEach(el => {
    if (!el) return;
    el.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        login();
      }
    });
  });
}

function exportRowsAsCsv(filename, headers, rows) {
  const escapeCell = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const content = [headers.map(escapeCell).join(',')]
    .concat(rows.map(row => row.map(escapeCell).join(',')))
    .join('\n');
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function toggleTableSort(sortState, col) {
  if (sortState.col === col) sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
  else { sortState.col = col; sortState.dir = 'asc'; }
}

function sortIndicator(sortState, col) {
  if (sortState.col !== col) return '<span class="sort-indicator">↕</span>';
  return sortState.dir === 'asc'
    ? '<span class="sort-indicator active">↑</span>'
    : '<span class="sort-indicator active">↓</span>';
}

function compareSortValues(a, b, dir) {
  var av = a == null || a === '' ? '' : a;
  var bv = b == null || b === '' ? '' : b;
  var numA = parseFloat(av);
  var numB = parseFloat(bv);
  if (!isNaN(numA) && !isNaN(numB) && /^-?\d/.test(String(av)) && /^-?\d/.test(String(bv))) {
    return dir === 'asc' ? numA - numB : numB - numA;
  }
  var sa = String(av).toLowerCase();
  var sb = String(bv).toLowerCase();
  if (sa < sb) return dir === 'asc' ? -1 : 1;
  if (sa > sb) return dir === 'asc' ? 1 : -1;
  return 0;
}

function sortRows(rows, sortState, getValue) {
  if (!sortState.col) return rows;
  return rows.slice().sort(function(a, b) {
    return compareSortValues(getValue(a, sortState.col), getValue(b, sortState.col), sortState.dir);
  });
}

function sortableTh(label, col, sortState, onclickFn) {
  return '<th class="sortable" onclick="' + onclickFn + '(\'' + col + '\')">' + label + sortIndicator(sortState, col) + '</th>';
}
