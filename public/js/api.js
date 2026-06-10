async function gasAPI(action, params = {}) {
  const url = window.GAS_URL;
  if (!url || url.includes('REPLACE_WITH')) {
    throw new Error('กรุณาตั้งค่า GAS_URL ใน config.js ก่อนใช้งาน');
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action, ...params })
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

async function bootstrapApp() {
  try {
    showLoadingToast('กำลังโหลดข้อมูลจากระบบ...');
    const res = await gasAPI('getBootstrap');
    if (!res.success) throw new Error(res.error || 'โหลดข้อมูลไม่สำเร็จ');
    allJobs = res.jobs || [];
    appMeta.stepConfig = res.stepConfig || [];
    renderFilterChips();
    populateStepSelects();
    renderList();
    renderDash();
    hideToast();
  } catch (e) {
    showToast('โหลดข้อมูลไม่สำเร็จ: ' + e.message, 'error', 4500);
  }
}

function populateStepSelects() {
  ['dashStepFilter', 'kpiStepFilter'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const current = el.value || 'all';
    el.innerHTML = '<option value="all">ทั้งหมด</option>' + (appMeta.stepConfig || [])
      .map(step => `<option value="${step.key}" ${current === step.key ? 'selected' : ''}>${step.label}</option>`)
      .join('');
  });
}

async function login() {
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value.trim();
  if (!username || !password) {
    showToast('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน', 'error');
    return;
  }

  const btn = document.getElementById('loginBtn');
  const txt = document.getElementById('loginBtnText');
  const spin = document.getElementById('loginBtnSpinner');

  try {
    btn.disabled = true;
    txt.textContent = 'กำลังตรวจสอบ...';
    spin.style.display = 'inline-block';
    showLoadingToast('กำลังเข้าสู่ระบบ...');
    const res = await gasAPI('login', { username, password });
    if (!res.success) throw new Error(res.error || 'เข้าสู่ระบบไม่สำเร็จ');
    currentUser = res.user;
    currentAuth = { username, password };
    document.getElementById('loginModal').classList.remove('open');
    document.getElementById('sessionUser').textContent = currentUser.username;
    document.getElementById('sessionRole').textContent = currentUser.isAdmin ? 'Admin' : currentUser.role;
    document.getElementById('sessionBadge').style.display = 'inline-flex';
    btn.disabled = false;
    txt.textContent = 'เข้าสู่ระบบ';
    spin.style.display = 'none';
    showToast('เข้าสู่ระบบสำเร็จ', 'success');
    refreshSheetIfOpen();
  } catch (e) {
    btn.disabled = false;
    txt.textContent = 'เข้าสู่ระบบ';
    spin.style.display = 'none';
    showToast(e.message, 'error', 4500);
  }
}

function ensureLoggedIn() {
  if (currentUser) return true;
  document.getElementById('loginModal').classList.add('open');
  showToast('กรุณาเข้าสู่ระบบก่อนใช้งาน', 'error');
  return false;
}

function refreshSheetIfOpen() {
  if (!selectedJob) return;
  const latest = allJobs.find(job => job.id === selectedJob.id);
  if (!latest) return;
  selectedJob = latest;
  renderSheetHeader();
  if (currentSheetTab === 'detail') renderDetailTab();
  if (currentSheetTab === 'step') renderStepTab();
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

window.onload = () => {
  setupKeyboardShortcuts();
  bootstrapApp();
  document.getElementById('loginModal').classList.add('open');
};