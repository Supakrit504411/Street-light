const STEP_COLORS = ['#EA580C', '#2563EB', '#0EA5E9', '#D97706', '#7C3AED', '#BE185D', '#DC2626', '#0891B2', '#16A34A', '#4B5563'];

let allJobs = [];
let selectedJob = null;
let currentFilter = 'all';
let currentSheetTab = 'detail';
let pendingStepFile = null;
let confirmCallback = null;
let appMeta = { stepConfig: [] };
let currentUser = null;
let currentAuth = { username: '', password: '' };
