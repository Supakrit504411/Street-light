// ============================================================
// api.js — GAS API layer
// เพิ่ม action ใหม่ที่นี่เพียงที่เดียว
// ============================================================

async function gasAPI(action, params = {}) {
  const url = window.GAS_URL;
  if (!url || url.includes('REPLACE_WITH')) {
    throw new Error('กรุณาตั้งค่า GAS_URL ใน config.js ก่อนใช้งาน');
  }
  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'text/plain' },
    body:    JSON.stringify({ action, ...params })
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

async function loadData() {
  try {
    const res = await gasAPI('getData');
    if (res.success) {
      allJobs = res.data;
      populateAssigneeDropdown();
      renderList();
      renderDash();
      updateSummary();
      renderKPI();
    } else {
      showToast('โหลดข้อมูลไม่สำเร็จ', 'error');
    }
  } catch (e) {
    showToast('เกิดข้อผิดพลาด: ' + e.message, 'error');
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = () => resolve(r.result.split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

window.onload = () => loadData();