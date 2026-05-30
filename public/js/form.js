// ============================================================
// form.js — Add job form & file upload
// แก้ฟอร์มเพิ่มงาน หรือ upload logic ที่นี่
// ============================================================

function handleFileSelect(event, type) {
  const file = event.target.files[0];
  if (!file) return;
  if (type === 'img') pendingImg = file;
  else pendingPdf = file;
  const pid = type === 'img' ? 'imgPreview' : 'pdfPreview';
  document.getElementById(pid).innerHTML = previewChip(file.name);
}

function handleStepFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  pendingStepFile = file;
  document.getElementById('step-file-preview').innerHTML = previewChip(file.name);
}

function previewChip(name) {
  return `<div class="preview-chip">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
    </svg>${name}</div>`;
}

async function submitJob() {
  const name   = document.getElementById('f-name').value.trim();
  const phone  = document.getElementById('f-phone').value.trim();
  const detail = document.getElementById('f-detail').value.trim();
  if (!name || !phone || !detail) { showToast('กรุณากรอกข้อมูลที่จำเป็น', 'error'); return; }

  const btn  = document.getElementById('submitBtn');
  const txt  = document.getElementById('submitText');
  const spin = document.getElementById('submitSpinner');
  btn.disabled = true; txt.textContent = 'กำลังบันทึก...'; spin.style.display = 'block';

  try {
    let imageUrl = '', fileUrl = '';
    if (pendingImg) {
      const b64 = await fileToBase64(pendingImg);
      const res = await gasAPI('uploadFile', { base64Data:b64, fileName:pendingImg.name, mimeType:pendingImg.type, subFolder:'IMG' });
      if (res.success) imageUrl = res.url;
    }
    if (pendingPdf) {
      const b64 = await fileToBase64(pendingPdf);
      const res = await gasAPI('uploadFile', { base64Data:b64, fileName:pendingPdf.name, mimeType:pendingPdf.type, subFolder:'PDF' });
      if (res.success) fileUrl = res.url;
    }

    const res = await gasAPI('saveData', { formData: {
      name, phone, detail,
      assignee: document.getElementById('f-assignee').value.trim(),
      note:     document.getElementById('f-note').value.trim(),
      imageUrl, fileUrl
    }});

    btn.disabled = false; txt.textContent = 'บันทึกงานใหม่'; spin.style.display = 'none';
    if (res.success) {
      showToast('บันทึกงาน ' + res.id + ' สำเร็จ!', 'success');
      clearForm(); loadData();
      document.querySelectorAll('.tab-item')[0].click();
    } else showToast('บันทึกไม่สำเร็จ: ' + res.error, 'error');

  } catch(e) {
    btn.disabled = false; txt.textContent = 'บันทึกงานใหม่'; spin.style.display = 'none';
    showToast('เกิดข้อผิดพลาด: ' + e.message, 'error');
  }
}

function clearForm() {
  ['f-name','f-phone','f-detail','f-assignee','f-note'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('imgPreview').innerHTML = '';
  document.getElementById('pdfPreview').innerHTML = '';
  document.getElementById('imgInput').value = '';
  document.getElementById('pdfInput').value = '';
  pendingImg = null; pendingPdf = null;
}