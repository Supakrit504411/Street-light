function getActiveStepKeyKpi(job) {
  for (var i = 0; i < job.steps.length; i++) {
    if (job.steps[i].value !== 'YES') return job.steps[i].key;
  }
  return '__complete__';
}

function renderDash() {
  var selectedStepKey = document.getElementById('dashStepFilter') ? document.getElementById('dashStepFilter').value : 'all';
  var search = (document.getElementById('dashSearchInput') ? document.getElementById('dashSearchInput').value : '').toLowerCase().trim();

  var filteredJobs = allJobs.filter(function(job) {
    if (selectedStepKey !== 'all') {
      if (getActiveStepKeyKpi(job) !== selectedStepKey) return false;
    }
    if (!search) return true;
    var hay = [job.detail.wbs, job.detail.description, job.detail.supervisor, job.id].join(' ').toLowerCase();
    return hay.indexOf(search) !== -1;
  });

  var total = allJobs.length || 1;
  document.getElementById('dashTotal').textContent = allJobs.length;
  document.getElementById('dashDone').textContent  = allJobs.filter(function(job) { return job.isComplete; }).length;
  document.getElementById('dashOpen').textContent  = allJobs.filter(function(job) { return !job.isComplete; }).length;

  // สถิติแต่ละสถานะ — นับงานที่ค้างอยู่ที่ step นั้น (active) เหมือน chip ในรายการงาน
  document.getElementById('dashStatusList').innerHTML = (appMeta.stepConfig || []).map(function(step, index) {
    var cnt = allJobs.filter(function(job) {
      return getActiveStepKeyKpi(job) === step.key;
    }).length;
    var pct = Math.round((cnt / total) * 100);
    return '<div class="status-row compact" style="cursor:pointer" onclick="filterDashByStep(\'' + step.key + '\')">'
      + '<div class="status-dot" style="background:' + STEP_COLORS[index] + '"></div>'
      + '<div class="status-label-block">'
        + '<div class="status-title">' + step.label + '</div>'
        + '<div class="status-pct">' + cnt + ' \u0e07\u0e32\u0e19 \u00b7 ' + pct + '%</div>'
      + '</div>'
      + '<div class="bar-track"><div class="bar-fill" style="width:' + pct + '%;background:' + STEP_COLORS[index] + '"></div></div>'
      + '</div>';
  }).join('');

  // ตาราง recentList — แสดงตาม filter
  document.getElementById('recentList').innerHTML = filteredJobs.length
    ? '<div class="table-wrap"><table class="dash-table">'
        + '<thead><tr><th>\u0e25\u0e33\u0e14\u0e31\u0e1a</th><th>WBS</th><th>\u0e04\u0e33\u0e2d\u0e18\u0e34\u0e1a\u0e32\u0e22</th><th>\u0e1c\u0e39\u0e49\u0e04\u0e27\u0e1a\u0e04\u0e38\u0e21\u0e07\u0e32\u0e19</th><th>\u0e04\u0e49\u0e32\u0e07\u0e2d\u0e22\u0e39\u0e48\u0e17\u0e35\u0e48</th><th>\u0e44\u0e1f\u0e25\u0e4c\u0e41\u0e19\u0e1a</th><th>\u0e40\u0e27\u0e25\u0e32</th></tr></thead>'
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
            var activeLabel = getActiveStepKeyKpi(job) === '__complete__'
              ? '\u2713 \u0e04\u0e23\u0e1a\u0e17\u0e38\u0e01\u0e02\u0e31\u0e49\u0e19'
              : ((appMeta.stepConfig || []).find(function(s) { return s.key === getActiveStepKeyKpi(job); }) || {}).label || '-';
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

// กดที่ step ใน dashboard แล้วกรองตาราง
function filterDashByStep(stepKey) {
  var el = document.getElementById('dashStepFilter');
  if (!el) return;
  el.value = el.value === stepKey ? 'all' : stepKey;
  renderDash();
}

function exportDashCsv() {
  var rows = allJobs.map(function(job, index) {
    return [index + 1, job.detail.wbs, job.detail.description, job.detail.supervisor,
      job.latestStep ? job.latestStep.label : '-', job.updatedAt || '-'];
  });
  exportRowsAsCsv('pea-dashboard.csv',
    ['\u0e25\u0e33\u0e14\u0e31\u0e1a','WBS','\u0e04\u0e33\u0e2d\u0e18\u0e34\u0e1a\u0e32\u0e22','\u0e1c\u0e39\u0e49\u0e04\u0e27\u0e1a\u0e04\u0e38\u0e21\u0e07\u0e32\u0e19','\u0e2a\u0e16\u0e32\u0e19\u0e30\u0e25\u0e48\u0e32\u0e2a\u0e38\u0e14','\u0e40\u0e27\u0e25\u0e32'],
    rows);
}