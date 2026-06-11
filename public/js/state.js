const STEP_COLORS = ['#EA580C', '#2563EB', '#0EA5E9', '#D97706', '#7C3AED', '#BE185D', '#DC2626', '#0891B2', '#16A34A', '#4B5563'];

let allJobs = [];
let selectedJob = null;
let currentFilter = 'all';
let currentSheetTab = 'detail';
let pendingStepFile = null;
let pendingStepKey = null;
let confirmCallback = null;
let appMeta = { stepConfig: [] };
let currentUser = null;
let currentAuth = { username: '', password: '' };
let statusFilters = [];
let listSort = { col: null, dir: 'asc' };
let dashSort = { col: null, dir: 'asc' };

// งานค้างอยู่ที่ step แรกที่ยังเป็น NO (ต้นทาง) ตามลำดับ workflow
function getActiveStepKey(job) {
  for (var i = 0; i < job.steps.length; i++) {
    if (job.steps[i].value !== 'YES') return job.steps[i].key;
  }
  return '__complete__';
}

function getActiveStepLabel(job) {
  if (getActiveStepKey(job) === '__complete__') return '\u2713 \u0e04\u0e23\u0e1a\u0e17\u0e38\u0e01\u0e02\u0e31\u0e49\u0e19';
  var step = (appMeta.stepConfig || []).find(function(s) { return s.key === getActiveStepKey(job); });
  return step ? step.label : '-';
}
