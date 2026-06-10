function getActiveStepKey(job) {
  for (var i = 0; i < job.steps.length; i++) {
    if (job.steps[i].value !== 'YES') return job.steps[i].key;
  }
  return '__complete__';
}

function populateStatusFilter() {
  var el = document.getElementById('f-status-filter');
  if (!el) return;
  var current = el.value;
  var values = [];
  allJobs.forEach(function(j) {
    if (j.detail.statusText && values.indexOf(j.detail.statusText) === -1) {
      values.push(j.detail.statusText);
    }
  });
  values.sort();
  var html = '<option value="">\u0e2a\u0e16\u0e32\u0e19\u0e30 (\u0e17\u0e31\u0e49\u0e07\u0e2b\u0e21\u0e14)</option>';
  values.forEach(function(v) {
    html += '<option value="' + v + '"' + (v === current ? ' selected' : '') + '>' + v + '</option>';
  });
  el.innerHTML = html;
}

function formatNumber(value) {
  var num = Number(value);
  if (isNaN(num)) return value || '-';
  return num.toFixed(2).replace(/\.00$/, '');
}

function renderFilterChips() {
  var q = (document.getElementById('searchInput').value || '').toLowerCase().trim();
  var transformerFilter = document.getElementById('f-transformer-filter').value.trim().toUpperCase();
  var statusEl = document.getElementById('f-status-filter');
  var statusFilter = statusEl ? statusEl.value.trim() : '';

  var baseJobs = allJobs.filter(function(job) {
    var hay = [job.id, job.detail.wbs, job.detail.peaNo, job.detail.description,
      job.detail.supervisor, job.detail.systemStatus, job.detail.statusText].join(' ').toLowerCase();
    if (q && hay.indexOf(q) === -1) return false;
    if (transformerFilter && String(job.transformer || '').toUpperCase() !== transformerFilter) return false;
    if (statusFilter && job.detail.statusText !== statusFilter) return false;
    return true;
  });

  var chips = [{ key: 'all', label: '\u0e17\u0e31\u0e49\u0e07\u0e2b\u0e21\u0e14', count: baseJobs.length }];
  (appMeta.stepConfig || []).forEach(function(step) {
    chips.push({
      key: step.key,
      label: step.label,
      count: baseJobs.filter(function(job) { return getActiveStepKey(job) === step.key; }).length
    });
  });

  document.getElementById('filterRow').innerHTML = chips.map(function(chip) {
    return '<div class="chip ' + (currentFilter === chip.key ? 'active' : '') + '" onclick="setFilter(\'' + chip.key + '\', this)">'
      + '<span>' + chip.label + '</span><strong>' + chip.count + '</strong></div>';
  }).join('');
}

function getFilteredJobs() {
  var q = (document.getElementById('searchInput').value || '').toLowerCase().trim();
  var transformerFilter = document.getElementById('f-transformer-filter').value.trim().toUpperCase();
  var statusEl = document.getElementById('f-status-filter');
  var statusFilter = statusEl ? statusEl.value.trim() : '';

  return allJobs.filter(function(job) {
    if (currentFilter !== 'all' && getActiveStepKey(job) !== currentFilter) return false;
    var hay = [job.id, job.detail.wbs, job.detail.peaNo, job.detail.description,
      job.detail.supervisor, job.detail.systemStatus, job.detail.statusText].join(' ').toLowerCase();
    if (q && hay.indexOf(q) === -1) return false;
    if (transformerFilter && String(job.transformer || '').toUpperCase() !== transformerFilter) return false;
    if (statusFilter && job.detail.statusText !== statusFilter) return false;
    return true;
  });
}

function setFilter(val, el) {
  currentFilter = val;
  document.querySelectorAll('.chip').forEach(function(c) { c.classList.remove('active'); });
  if (el) el.classList.add('active');
  renderList();
}

function renderList() {
  populateStatusFilter();
  var jobs = getFilteredJobs();
  updateSummary(jobs);
  renderFilterChips();
  document.getElementById('listCount').textContent = jobs.length + ' \u0e07\u0e32\u0e19';
  document.getElementById('jobList').innerHTML = jobs.length
    ? jobs.map(function(job, index) { return jobRowHTML(job, index); }).join('')
    : '<tr><td colspan="10" class="kpi-empty">\u0e44\u0e21\u0e48\u0e1e\u0e1a\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e07\u0e32\u0e19</td></tr>';
}

function jobRowHTML(job, index) {
  var latest = job.latestStep;

  var fileCell = '';
  if (job.latestFileUrl) {
    var m = job.latestFileUrl.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
    var thumb = m ? 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w400' : '';
    fileCell = '<a href="' + job.latestFileUrl + '" target="_blank" class="file-link"'
      + ' onclick="event.stopPropagation()"'
      + ' onmouseenter="showFilePreview(event,\'' + job.latestFileUrl + '\',\'' + thumb + '\')"'
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
      + '<div class="kpi-latest-step"><span class="current-step-tag">\u0e25\u0e48\u0e32\u0e2a\u0e38\u0e14</span> ' + (latest ? latest.label : '-') + '</div>'
      + '<div class="kpi-latest-meta">' + (job.updatedAt || '-') + '</div>'
      + fileCell
    + '</td>'
    + '<td class="action-cell">'
      + '<button class="update-btn" onclick="event.stopPropagation();openSheet(\'' + job.id + '\')">\u0e2d\u0e31\u0e1b\u0e40\u0e14\u0e15</button>'
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
    ['\u0e25\u0e33\u0e14\u0e31\u0e1a','WBS','\u0e04\u0e33\u0e2d\u0e18\u0e34\u0e1a\u0e32\u0e22','\u0e1c\u0e39\u0e49\u0e04\u0e27\u0e1a\u0e04\u0e38\u0e21\u0e07\u0e32\u0e19','\u0e2a\u0e16\u0e32\u0e19\u0e30\u0e23\u0e30\u0e1a\u0e1a','\u0e2a\u0e16\u0e32\u0e19\u0e30','%\u0e40\u0e1a\u0e34\u0e01\u0e1e\u0e31\u0e2a\u0e14\u0e38','%\u0e40\u0e1a\u0e34\u0e01\u0e04\u0e48\u0e32\u0e41\u0e23\u0e07','\u0e2a\u0e16\u0e32\u0e19\u0e30\u0e25\u0e48\u0e32\u0e2a\u0e38\u0e14','\u0e44\u0e1f\u0e25\u0e4c\u0e41\u0e19\u0e1a','\u0e40\u0e27\u0e25\u0e32'],
    jobs.map(function(job, i) {
      return [
        i+1, job.detail.wbs, job.detail.description, job.detail.supervisor,
        job.detail.systemStatus, job.detail.statusText,
        formatNumber(job.detail.materialPct), formatNumber(job.detail.withdrawPct),
        job.latestStep ? job.latestStep.label : '-',
        job.latestFileUrl || '', job.updatedAt || '-'
      ];
    })
  );
}