function handleStepFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  pendingStepFile = file;
  const preview = document.getElementById('step-file-preview');
  if (preview) preview.innerHTML = previewChip(file.name);
}

function handleModalStepFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  pendingStepFile = file;
  const preview = document.getElementById('stepModalFilePreview');
  if (preview) preview.innerHTML = previewChip(file.name);
}

function previewChip(name) {
  return `<div class="preview-chip">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
    </svg>${name}</div>`;
}
