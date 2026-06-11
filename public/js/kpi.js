function getDashSearchQuery() {
  return (document.getElementById('dashSearchInput') ? document.getElementById('dashSearchInput').value : '').toLowerCase().trim();
}

function getDashBaseJobs() {
  var search = getDashSearchQuery();
  return allJobs.filter(function(job) {
    if (!search) return true;
    var hay = [job.detail.wbs, job.detail.description, job.detail.supervisor, job.id].join(' ').toLowerCase();
    return hay.indexOf(search) !== -1;
  });
}

function getDashSortValue(job, col) {
  switch (col) {
    case 'wbs': return job.detail.wbs || '';
    case 'description': return job.detail.description || '';
    case 'supervisor': return job.detail.supervisor || '';
    case 'pending': return getActiveStepLabel(job);
    case 'updatedAt': return job.updatedAt || '';
    default: return '';
  }
}

function sortDashBy(col) {
  toggleTableSort(dashSort, col);
  renderDash();
}

function renderDashTableHead() {
  return '<thead><tr>'
    + '<th>\u0e25\u0e33\u0e14\u0e31\u0e1a</th>'
    + sortableTh('WBS', 'wbs', dashSort, 'sortDashBy')
    + sortableTh('\u0e04\u0e33\u0e2d\u0e18\u0e34\u0e1a\u0e32\u0e22', 'description', dashSort, 'sortDashBy')
    + sortableTh('\u0e1c\u0e39\u0e49\u0e04\u0e27\u0e1a\u0e04\u0e38\u0e21\u0e07\u0e32\u0e19', 'supervisor', dashSort, 'sortDashBy')
    + sortableTh('\u0e04\u0e49\u0e32\u0e07\u0e2d\u0e22\u0e39\u0e48\u0e17\u0e35\u0e48', 'pending', dashSort, 'sortDashBy')
    + '<th>\u0e44\u0e1f\u0e25\u0e4c\u0e41\u0e19\u0e1a</th>'
    + sortableTh('\u0e40\u0e27\u0e25\u0e32', 'updatedAt', dashSort, 'sortDashBy')
    + '</tr></thead>';
}

function renderDash() {
  var selectedStepKey = document.getElementById('dashStepFilter') ? document.getElementById('dashStepFilter').value : 'all';
  var baseJobs = getDashBaseJobs();

  var filteredJobs = baseJobs.filter(function(job) {
    if (selectedStepKey !== 'all' && getActiveStepKey(job) !== selectedStepKey) return false;
    return true;
  });

  filteredJobs = sortRows(filteredJobs, dashSort, getDashSortValue);

  var total = baseJobs.length || 1;
  document.getElementById('dashTotal').textContent = filteredJobs.length;
  document.getElementById('dashDone').textContent  = filteredJobs.filter(function(job) { return job.isComplete; }).length;
  document.getElementById('dashOpen').textContent  = filteredJobs.filter(function(job) { return !job.isComplete; }).length;

  var statusRows = [{ key: 'all', label: '\u0e17\u0e31\u0e49\u0e07\u0e2b\u0e21\u0e14', count: baseJobs.length }];
  (appMeta.stepConfig || []).forEach(function(step, index) {
    statusRows.push({
      key: step.key,
      label: (index + 1) + '.' + step.label,
      count: baseJobs.filter(function(job) { return getActiveStepKey(job) === step.key; }).length,
      color: STEP_COLORS[index]
    });
  });

  document.getElementById('dashStatusList').innerHTML = statusRows.map(function(row) {
    var isActive = selectedStepKey === row.key;
    var pct = Math.round((row.count / total) * 100);
    if (row.key === 'all') {
      return '<div class="status-row compact' + (isActive ? ' active' : '') + '" onclick="filterDashByStep(\'all\')">'
        + '<div class="status-dot" style="background:#94a3b8"></div>'
        + '<div class="status-label-block">'
          + '<div class="status-title">' + row.label + '</div>'
          + '<div class="status-count-big">' + row.count + '</div>'
          + '<div class="status-pct-sub">\u0e07\u0e32\u0e19</div>'
        + '</div>'
        + '</div>';
    }
    return '<div class="status-row compact' + (isActive ? ' active' : '') + '" onclick="filterDashByStep(\'' + row.key + '\')">'
      + '<div class="status-dot" style="background:' + row.color + '"></div>'
      + '<div class="status-label-block">'
        + '<div class="status-title">' + row.label + '</div>'
        + '<div class="status-count-big">' + row.count + '</div>'
        + '<div class="status-pct-sub">\u0e07\u0e32\u0e19 \u00b7 ' + pct + '%</div>'
      + '</div>'
      + '<div class="bar-track"><div class="bar-fill" style="width:' + pct + '%;background:' + row.color + '"></div></div>'
      + '</div>';
  }).join('');

  document.getElementById('recentList').innerHTML = filteredJobs.length
    ? '<div class="table-wrap"><table class="dash-table">'
        + renderDashTableHead()
        + '<tbody>' + filteredJobs.slice(0, 50).map(function(job, index) {
            var m = (job.latestFileUrl || '').match(/\/d\/([a-zA-Z0-9_-]{10,})/);
            var thumb = m ? 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w400' : '';
            var fileHtml = job.latestFileUrl
              ? '<a href="' + job.latestFileUrl + '" target="_blank" class="file-link"'
                + ' onclick="event.stopPropagation()"'
                + ' onmouseenter="showFilePreview(event,\'' + job.latestFileUrl + '\',\'' + thumb + '\')"'
                + ' onmousemove="moveFilePreview(event)"'
                + ' onmouseleave="hideFilePreview()">'
                + '\ud83d\udcce \u0e14\u0e39\u0e44\u0e1f\u0e25\u0e4c</a>'
              : '<span class="muted-inline">-</span>';
            var activeLabel = getActiveStepLabel(job);
            return '<tr onclick="openSheet(\'' + job.id + '\')">'
              + '<td>' + (index + 1) + '</td>'
              + '<td>' + (job.detail.wbs || '-') + '</td>'
              + '<td>' + (job.detail.description || '-') + '</td>'
              + '<td>' + (job.detail.supervisor || '-') + '</td>'
              + '<td>' + activeLabel + '</td>'
              + '<td>' + fileHtml + '</td>'
              + '<td>' + (job.updatedAt || '-') + '</td>'
              + '</tr>';
          }).join('')
        + '</tbody></table></div>'
    : '<div style="padding:16px;text-align:center;color:#667085;font-size:13px">\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e21\u0e35\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e15\u0e32\u0e21\u0e15\u0e31\u0e27\u0e01\u0e23\u0e2d\u0e07</div>';
}

function filterDashByStep(stepKey) {
  var el = document.getElementById('dashStepFilter');
  if (!el) return;
  if (stepKey === 'all') el.value = 'all';
  else el.value = el.value === stepKey ? 'all' : stepKey;
  renderDash();
}

function exportDashCsv() {
  var rows = allJobs.map(function(job, index) {
    return [index + 1, job.detail.wbs, job.detail.description, job.detail.supervisor,
      getActiveStepLabel(job), job.updatedAt || '-'];
  });
  exportRowsAsCsv('pea-dashboard.csv',
    ['\u0e25\u0e33\u0e14\u0e31\u0e1a','WBS','\u0e04\u0e33\u0e2d\u0e18\u0e34\u0e1a\u0e32\u0e22','\u0e1c\u0e39\u0e49\u0e04\u0e27\u0e1a\u0e04\u0e38\u0e21\u0e07\u0e32\u0e19','\u0e04\u0e49\u0e32\u0e07\u0e2d\u0e22\u0e39\u0e48\u0e17\u0e35\u0e48','\u0e40\u0e27\u0e25\u0e32'],
    rows);
}
