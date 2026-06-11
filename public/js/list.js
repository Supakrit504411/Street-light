function getListSearchQuery() {
  return (document.getElementById('searchInput').value || '').toLowerCase().trim();
}

function getListTransformerFilter() {
  return document.getElementById('f-transformer-filter').value.trim().toUpperCase();
}

function jobMatchesSearch(job, q) {
  if (!q) return true;
  var hay = [job.id, job.detail.wbs, job.detail.peaNo, job.detail.description,
    job.detail.supervisor, job.detail.systemStatus, job.detail.statusText].join(' ').toLowerCase();
  return hay.indexOf(q) !== -1;
}

function jobMatchesStatusFilters(job) {
  if (!statusFilters.length) return true;
  return statusFilters.indexOf(job.detail.statusText) !== -1;
}

function getJobsForListCounts(exclude) {
  var q = getListSearchQuery();
  var transformerFilter = exclude === 'transformer' ? '' : getListTransformerFilter();
  var chipFilter = exclude === 'chip' ? 'all' : currentFilter;
  var useStatus = exclude !== 'status';

  return allJobs.filter(function(job) {
    if (chipFilter !== 'all' && getActiveStepKey(job) !== chipFilter) return false;
    if (!jobMatchesSearch(job, q)) return false;
    if (transformerFilter && String(job.transformer || '').toUpperCase() !== transformerFilter) return false;
    if (useStatus && !jobMatchesStatusFilters(job)) return false;
    return true;
  });
}

function populateTransformerFilter() {
  var el = document.getElementById('f-transformer-filter');
  if (!el) return;
  var current = el.value;
  var jobs = getJobsForListCounts('transformer');
  var peaCount = jobs.filter(function(j) { return String(j.transformer || '').toUpperCase() === 'PEA'; }).length;
  var cusCount = jobs.filter(function(j) { return String(j.transformer || '').toUpperCase() === 'CUS'; }).length;
  el.innerHTML = ''
    + '<option value="">\u0e17\u0e31\u0e49\u0e07\u0e2b\u0e21\u0e14 (' + jobs.length + ')</option>'
    + '<option value="PEA"' + (current === 'PEA' ? ' selected' : '') + '>PEA (' + peaCount + ')</option>'
    + '<option value="CUS"' + (current === 'CUS' ? ' selected' : '') + '>CUS (' + cusCount + ')</option>';
}

function populateStatusFilter() {
  var dropdown = document.getElementById('status-filter-dropdown');
  if (!dropdown) return;
  var values = [];
  allJobs.forEach(function(j) {
    if (j.detail.statusText && values.indexOf(j.detail.statusText) === -1) values.push(j.detail.statusText);
  });
  values.sort();
  dropdown.innerHTML = values.map(function(v) {
    var checked = statusFilters.indexOf(v) !== -1 ? ' checked' : '';
    return '<label class="multi-filter-item">'
      + '<input type="checkbox" value="' + escapeAttr(v) + '"' + checked + ' onchange="toggleStatusFilter(this)">'
      + '<span>' + escapeHtml(v) + '</span></label>';
  }).join('') || '<div class="multi-filter-empty">\u0e44\u0e21\u0e48\u0e21\u0e35\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e2a\u0e16\u0e32\u0e19\u0e30</div>';
  updateStatusFilterLabel();
}

function escapeAttr(value) {
  return String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function escapeHtml(value) {
  return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function updateStatusFilterLabel() {
  var label = document.getElementById('status-filter-label');
  if (!label) return;
  if (!statusFilters.length) label.textContent = '\u0e17\u0e31\u0e49\u0e07\u0e2b\u0e21\u0e14';
  else if (statusFilters.length === 1) label.textContent = statusFilters[0];
  else label.textContent = '\u0e40\u0e25\u0e37\u0e2d\u0e01 ' + statusFilters.length + ' \u0e23\u0e32\u0e22\u0e01\u0e32\u0e23';
}

function toggleStatusDropdown(event) {
  if (event) event.stopPropagation();
  var dropdown = document.getElementById('status-filter-dropdown');
  if (!dropdown) return;
  dropdown.classList.toggle('open');
}

function toggleStatusFilter(el) {
  var value = el.value;
  if (el.checked) {
    if (statusFilters.indexOf(value) === -1) statusFilters.push(value);
  } else {
    statusFilters = statusFilters.filter(function(v) { return v !== value; });
  }
  updateStatusFilterLabel();
  renderList();
}

function clearStatusFilters(event) {
  if (event) event.stopPropagation();
  statusFilters = [];
  populateStatusFilter();
  renderList();
}

function setupStatusFilterOutsideClick() {
  document.addEventListener('click', function(e) {
    var wrap = document.getElementById('status-filter-wrap');
    var dropdown = document.getElementById('status-filter-dropdown');
    if (!wrap || !dropdown || !dropdown.classList.contains('open')) return;
    if (!wrap.contains(e.target)) dropdown.classList.remove('open');
  });
}

function formatNumber(value) {
  var num = Number(value);
  if (isNaN(num)) return value || '-';
  return num.toFixed(2).replace(/\.00$/, '');
}

function renderFilterChips() {
  var baseJobs = getJobsForListCounts('chip');
  var chips = [{ key: 'all', label: '\u0e17\u0e31\u0e49\u0e07\u0e2b\u0e21\u0e14', count: baseJobs.length, num: null }];
  (appMeta.stepConfig || []).forEach(function(step, index) {
    chips.push({
      key: step.key,
      label: (index + 1) + '.' + step.label,
      count: baseJobs.filter(function(job) { return getActiveStepKey(job) === step.key; }).length,
      num: index + 1
    });
  });

  document.getElementById('filterRow').innerHTML = chips.map(function(chip) {
    return '<div class="chip ' + (currentFilter === chip.key ? 'active' : '') + '" onclick="setFilter(\'' + chip.key + '\', this)">'
      + '<span>' + chip.label + '</span><strong>' + chip.count + '</strong></div>';
  }).join('');
}

function getFilteredJobs() {
  return getJobsForListCounts(null);
}

function getListSortValue(job, col) {
  switch (col) {
    case 'wbs': return job.detail.wbs || '';
    case 'description': return job.detail.description || '';
    case 'supervisor': return job.detail.supervisor || '';
    case 'systemStatus': return job.detail.systemStatus || '';
    case 'statusText': return job.detail.statusText || '';
    case 'materialPct': return job.detail.materialPct || '';
    case 'withdrawPct': return job.detail.withdrawPct || '';
    case 'pending': return getActiveStepLabel(job);
    case 'updatedAt': return job.updatedAt || '';
    case 'transformer': return job.transformer || '';
    default: return '';
  }
}

function sortListBy(col) {
  toggleTableSort(listSort, col);
  renderList();
}

function renderListTableHead() {
  var thead = document.getElementById('jobListHead');
  if (!thead) return;
  thead.innerHTML = '<tr>'
    + '<th>\u0e25\u0e33\u0e14\u0e31\u0e1a</th>'
    + sortableTh('WBS', 'wbs', listSort, 'sortListBy')
    + sortableTh('\u0e04\u0e33\u0e2d\u0e18\u0e34\u0e1a\u0e32\u0e22', 'description', listSort, 'sortListBy')
    + sortableTh('\u0e1c\u0e39\u0e49\u0e04\u0e27\u0e1a\u0e04\u0e38\u0e21\u0e07\u0e32\u0e19', 'supervisor', listSort, 'sortListBy')
    + sortableTh('\u0e2a\u0e16\u0e32\u0e19\u0e30\u0e23\u0e30\u0e1a\u0e1a', 'systemStatus', listSort, 'sortListBy')
    + sortableTh('\u0e2a\u0e16\u0e32\u0e19\u0e30', 'statusText', listSort, 'sortListBy')
    + sortableTh('%\u0e40\u0e1a\u0e34\u0e01\u0e1e\u0e31\u0e2a\u0e14\u0e38', 'materialPct', listSort, 'sortListBy')
    + sortableTh('%\u0e40\u0e1a\u0e34\u0e01 \u0e04\u0e48\u0e32\u0e41\u0e23\u0e07', 'withdrawPct', listSort, 'sortListBy')
    + sortableTh('\u0e04\u0e49\u0e32\u0e07\u0e2d\u0e22\u0e39\u0e48\u0e17\u0e35\u0e48 / \u0e44\u0e1f\u0e25\u0e4c / \u0e40\u0e27\u0e25\u0e32', 'pending', listSort, 'sortListBy')
    + '<th>Action</th>'
    + '</tr>';
}

function setFilter(val, el) {
  currentFilter = val;
  document.querySelectorAll('.chip').forEach(function(c) { c.classList.remove('active'); });
  if (el) el.classList.add('active');
  renderList();
}

function renderList() {
  populateTransformerFilter();
  populateStatusFilter();
  renderListTableHead();
  var jobs = sortRows(getFilteredJobs(), listSort, getListSortValue);
  updateSummary(jobs);
  renderFilterChips();
  document.getElementById('listCount').textContent = jobs.length + ' \u0e07\u0e32\u0e19';
  document.getElementById('jobList').innerHTML = jobs.length
    ? jobs.map(function(job, index) { return jobRowHTML(job, index); }).join('')
    : '<tr><td colspan="10" class="kpi-empty">\u0e44\u0e21\u0e48\u0e1e\u0e1a\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e07\u0e32\u0e19</td></tr>';
}

function transformerToggleHTML(job) {
  var tf = String(job.transformer || '').toUpperCase();
  return '<div class="transformer-toggle" onclick="event.stopPropagation()">'
    + '<label class="tf-opt' + (tf === 'PEA' ? ' active' : '') + '">'
      + '<input type="radio" name="tf-' + job.id + '" value="PEA"' + (tf === 'PEA' ? ' checked' : '') + ' onchange="setJobTransformer(\'' + job.id + '\',\'PEA\')">'
      + '<span>PEA</span></label>'
    + '<label class="tf-opt' + (tf === 'CUS' ? ' active' : '') + '">'
      + '<input type="radio" name="tf-' + job.id + '" value="CUS"' + (tf === 'CUS' ? ' checked' : '') + ' onchange="setJobTransformer(\'' + job.id + '\',\'CUS\')">'
      + '<span>CUS</span></label>'
    + '</div>';
}

async function setJobTransformer(jobId, value) {
  if (!ensureLoggedIn()) { renderList(); return; }
  try {
    var res = await gasAPI('updateTransformer', { jobId: jobId, transformer: value, auth: currentAuth });
    if (!res.success) throw new Error(res.error || '\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01\u0e44\u0e21\u0e48\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08');
    var job = allJobs.find(function(j) { return j.id === jobId; });
    if (job) job.transformer = value;
    renderList();
    showToast('\u0e15\u0e31\u0e49\u0e07\u0e04\u0e48\u0e32 Transformer \u0e40\u0e1b\u0e47\u0e19 ' + value, 'success');
  } catch (e) {
    showToast(e.message, 'error');
    renderList();
  }
}

function jobRowHTML(job, index) {
  var pendingLabel = getActiveStepLabel(job);
  var pendingFile = '';
  if (getActiveStepKey(job) !== '__complete__') {
    var pendingStep = job.steps.find(function(s) { return s.key === getActiveStepKey(job); });
    if (pendingStep && pendingStep.fileUrl) pendingFile = pendingStep.fileUrl;
  }
  if (!pendingFile) pendingFile = job.latestFileUrl || '';

  var fileCell = '';
  if (pendingFile) {
    var m = pendingFile.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
    var thumb = m ? 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w400' : '';
    fileCell = '<a href="' + pendingFile + '" target="_blank" class="file-link"'
      + ' onclick="event.stopPropagation()"'
      + ' onmouseenter="showFilePreview(event,\'' + pendingFile + '\',\'' + thumb + '\')"'
      + ' onmousemove="moveFilePreview(event)"'
      + ' onmouseleave="hideFilePreview()">'
      + '\ud83d\udcce \u0e14\u0e39\u0e44\u0e1f\u0e25\u0e4c</a>';
  } else {
    fileCell = '<span class="muted-inline">\u0e44\u0e21\u0e48\u0e21\u0e35\u0e44\u0e1f\u0e25\u0e4c</span>';
  }

  var latLong = job.latLong || '';
  var navBtn = latLong
    ? '<button class="nav-btn" title="\u0e19\u0e33\u0e17\u0e32\u0e07" onclick="event.stopPropagation();openNavigation(\'' + latLong + '\')">\ud83e\uddad</button>'
    : '<button class="nav-btn" disabled title="\u0e44\u0e21\u0e48\u0e21\u0e35\u0e1e\u0e34\u0e01\u0e31\u0e14">\ud83d\udccd</button>';

  return '<tr>'
    + '<td>' + (index + 1) + '</td>'
    + '<td>' + (job.detail.wbs || '-') + '</td>'
    + '<td>' + (job.detail.description || '-') + '</td>'
    + '<td>' + (job.detail.supervisor || '-') + '</td>'
    + '<td>' + (job.detail.systemStatus || '-') + '</td>'
    + '<td>' + (job.detail.statusText || '-') + '</td>'
    + '<td>' + formatNumber(job.detail.materialPct) + '</td>'
    + '<td>' + formatNumber(job.detail.withdrawPct) + '</td>'
    + '<td>'
      + '<div class="kpi-latest-step"><span class="current-step-tag">\u0e04\u0e49\u0e32\u0e07\u0e2d\u0e22\u0e39\u0e48\u0e17\u0e35\u0e48</span> ' + pendingLabel + '</div>'
      + '<div class="kpi-latest-meta">' + (job.updatedAt || '-') + '</div>'
      + fileCell
    + '</td>'
    + '<td class="action-cell">'
      + '<button class="update-btn" onclick="event.stopPropagation();openSheet(\'' + job.id + '\')">\u0e2d\u0e31\u0e1b\u0e40\u0e14\u0e15</button>'
      + transformerToggleHTML(job)
      + navBtn
    + '</td>'
    + '</tr>';
}

function openNavigation(latLong) {
  var cleaned = latLong.replace(/\s+/, ',').trim();
  window.open('https://www.google.com/maps/dir/?api=1&destination=' + cleaned, '_blank');
}

function updateSummary(jobs) {
  if (!jobs) jobs = allJobs;
  var total  = jobs.length;
  var done   = jobs.filter(function(job) { return job.isComplete; }).length;
  var active = total - done;
  document.getElementById('cnt-total').textContent  = total;
  document.getElementById('cnt-active').textContent = active;
  document.getElementById('cnt-done').textContent   = done;
}

function exportListCsv() {
  var jobs = getFilteredJobs();
  exportRowsAsCsv(
    'pea-list.csv',
    ['\u0e25\u0e33\u0e14\u0e31\u0e1a','WBS','\u0e04\u0e33\u0e2d\u0e18\u0e34\u0e1a\u0e32\u0e22','\u0e1c\u0e39\u0e49\u0e04\u0e27\u0e1a\u0e04\u0e38\u0e21\u0e07\u0e32\u0e19','\u0e2a\u0e16\u0e32\u0e19\u0e30\u0e23\u0e30\u0e1a\u0e1a','\u0e2a\u0e16\u0e32\u0e19\u0e30','%\u0e40\u0e1a\u0e34\u0e01\u0e1e\u0e31\u0e2a\u0e14\u0e38','%\u0e40\u0e1a\u0e34\u0e01\u0e04\u0e48\u0e32\u0e41\u0e23\u0e07','\u0e04\u0e49\u0e32\u0e07\u0e2d\u0e22\u0e39\u0e48\u0e17\u0e35\u0e48','Transformer','\u0e44\u0e1f\u0e25\u0e4c\u0e41\u0e19\u0e1a','\u0e40\u0e27\u0e25\u0e32'],
    jobs.map(function(job, i) {
      return [
        i + 1, job.detail.wbs, job.detail.description, job.detail.supervisor,
        job.detail.systemStatus, job.detail.statusText,
        formatNumber(job.detail.materialPct), formatNumber(job.detail.withdrawPct),
        getActiveStepLabel(job), job.transformer || '',
        job.latestFileUrl || '', job.updatedAt || '-'
      ];
    })
  );
}

var WBS_SEGMENT_LENGTHS = [1, 2, 1, 5, 4];
var WBS_PATTERN = /^[A-Za-z0-9]-[A-Za-z0-9]{2}-[A-Za-z0-9]-[A-Za-z0-9]{5}\.[A-Za-z0-9]{4}$/;

function formatAddJobWbsInput(el) {
  var clean = String(el.value || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 13);
  var parts = [];
  var idx = 0;
  for (var i = 0; i < WBS_SEGMENT_LENGTHS.length; i++) {
    var part = clean.substr(idx, WBS_SEGMENT_LENGTHS[i]);
    idx += WBS_SEGMENT_LENGTHS[i];
    if (!part) break;
    parts.push(part);
  }
  var formatted = '';
  if (parts.length === 1) formatted = parts[0];
  else if (parts.length === 2) formatted = parts[0] + '-' + parts[1];
  else if (parts.length === 3) formatted = parts[0] + '-' + parts[1] + '-' + parts[2];
  else if (parts.length === 4) formatted = parts[0] + '-' + parts[1] + '-' + parts[2] + '-' + parts[3];
  else if (parts.length >= 5) formatted = parts[0] + '-' + parts[1] + '-' + parts[2] + '-' + parts[3] + '.' + parts[4];
  el.value = formatted;
}

function getAddJobWbsValue() {
  return (document.getElementById('addJobWbsInput').value || '').trim().toUpperCase();
}

function getAddJobTransformerValue() {
  var checked = document.querySelector('input[name="addJobTf"]:checked');
  return checked ? checked.value : '';
}

function syncAddJobTransformerToggle(radio) {
  document.querySelectorAll('#addJobTransformer .tf-opt').forEach(function(el) {
    el.classList.remove('active');
  });
  if (radio && radio.closest) radio.closest('.tf-opt').classList.add('active');
}

function openAddJobModal() {
  if (!ensureLoggedIn()) return;
  document.getElementById('addJobWbsInput').value = '';
  var pea = document.querySelector('#addJobTransformer input[value="PEA"]');
  if (pea) {
    pea.checked = true;
    syncAddJobTransformerToggle(pea);
  }
  document.getElementById('addJobModal').classList.add('open');
  setTimeout(function() {
    var input = document.getElementById('addJobWbsInput');
    if (input) input.focus();
  }, 80);
}

function closeAddJobModal() {
  document.getElementById('addJobModal').classList.remove('open');
}

async function submitAddJob() {
  if (!ensureLoggedIn()) return;
  var wbs = getAddJobWbsValue();
  var transformer = getAddJobTransformerValue();
  if (!WBS_PATTERN.test(wbs)) {
    showToast('\u0e01\u0e23\u0e38\u0e13\u0e32\u0e01\u0e23\u0e2d\u0e01 WBS \u0e43\u0e2b\u0e49\u0e04\u0e23\u0e1a x-xx-x-xxxxx.xxxx (\u0e40\u0e0a\u0e48\u0e19 C-69-D-NPNSR.1234)', 'error');
    return;
  }
  if (!transformer) {
    showToast('\u0e01\u0e23\u0e38\u0e13\u0e32\u0e40\u0e25\u0e37\u0e2d\u0e01 Transformer PEA \u0e2b\u0e23\u0e37\u0e2d CUS', 'error');
    return;
  }

  var btn = document.getElementById('addJobSubmitBtn');
  var txt = document.getElementById('addJobSubmitText');
  var spin = document.getElementById('addJobSpinner');
  try {
    btn.disabled = true;
    txt.textContent = '\u0e01\u0e33\u0e25\u0e31\u0e07\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01...';
    spin.style.display = 'inline-block';
    var res = await gasAPI('createJob', {
      payload: { wbs: wbs, transformer: transformer, auth: currentAuth }
    });
    if (!res.success) throw new Error(res.error || '\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01\u0e44\u0e21\u0e48\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08');
    closeAddJobModal();
    showToast('\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e41\u0e1f\u0e49\u0e21\u0e07\u0e32\u0e19 ' + wbs + ' \u0e41\u0e25\u0e49\u0e27', 'success');
    await bootstrapApp();
  } catch (e) {
    showToast(e.message, 'error', 4500);
  } finally {
    btn.disabled = false;
    txt.textContent = '\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01';
    spin.style.display = 'none';
  }
}

setupStatusFilterOutsideClick();
