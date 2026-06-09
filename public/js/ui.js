function switchTab(tab, el) {
  document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('page-' + tab).classList.add('active');
  if (tab === 'kpi') renderKPI();
}

let toastTimer;
function showToast(msg, type) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show ' + (type || '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 3000);
}

function openConfirm({ title, desc, summary, onConfirm }) {
  document.getElementById('dlgTitle').textContent = title;
  document.getElementById('dlgDesc').textContent = desc;
  document.getElementById('dlgSummary').innerHTML = summary;
  document.getElementById('dlgConfirmText').textContent = 'ยืนยัน บันทึก';
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
