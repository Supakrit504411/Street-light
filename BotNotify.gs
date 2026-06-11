/**
 * ═══ คู่มือตั้งค่า Bot (อ่านอย่างเดียว — ไม่ต้องรันบล็อกนี้) ═══
 *
 * ทำทีละขั้นใน Apps Script Editor:
 *   ขั้น 1 → แก้ค่าใน setupBotOnce() แล้ว Run
 *   ขั้น 2 → Run setupBotStep2()
 *   ขั้น 3 → ไปตั้ง LINE Webhook URL ในเว็บ LINE Developers (copy จาก showBotWebhookUrls)
 *   ขั้น 3b→ Telegram: Run enableTelegramPolling() (GAS ใช้ polling แทน webhook)
 *   ขั้น 4 → กรอกชีต NOTIFY
 *   ขั้น 5 → Run testSendDailyPush() ทดสอบ
 */

const NOTIFY_SHEET_NAME = 'NOTIFY';
const SUMMARY_KEYWORD = 'สรุปสถานะ';
const SUMMARY_KEYWORD_ALT = 'สรุปสถานะงาน';
const TELEGRAM_POLL_INTERVAL_SEC = 5;
const TELEGRAM_POLL_ROUNDS = 11;

// ═══ ขั้นที่ 1: แก้ค่าด้านล่างให้เป็นของจริง แล้วเลือกฟังก์ชัน setupBotOnce → กด Run ▶ ═══
function setupBotOnce() {
  configureBotSecrets({
    lineChannelAccessToken: 'วาง LINE Channel Access Token',
    lineChannelSecret: 'วาง LINE Channel Secret',
    telegramBotToken: 'วาง Telegram Bot Token',
    webAppUrl: 'https://your-app.vercel.app',  // URL เว็บ PEA Tracking
    webhookUrl: 'https://script.google.com/macros/s/DEPLOY_ID/exec',  // URL Web App deploy (ลงท้าย /exec)
    botWebhookSecret: 'PeaBot2026_ใส่รหัสลับยาวๆ'  // สร้างเอง จดไว้ (ไม่บังคับใน URL แล้ว)
  });
}

// ═══ ขั้นที่ 2: เลือก setupBotStep2 → กด Run ▶ (ครั้งเดียว) ═══
function setupBotStep2() {
  installDailyPushTrigger(8);  // push ทุกวัน 08:00 น.
  return enableTelegramPolling();
}

// ═══ ดู URL สำหรับ copy ไปวางใน LINE Developers ═══
function showBotWebhookUrls() {
  const execUrl = getWebAppDeployUrl_();
  const tgUrl = buildTelegramWebhookUrl_();
  const info = {
    webhookUrl: execUrl,
    lineWebhookUrl: execUrl,
    telegramWebhookUrl: tgUrl,
    note: 'LINE ใช้ URL ลงท้าย /exec | Telegram อาจใช้ redirect URL (googleusercontent) อัตโนมัติผ่าน repairAllBots()',
    hasLineToken: !!getBotProp_('LINE_CHANNEL_ACCESS_TOKEN'),
    hasTelegramToken: !!getBotProp_('TELEGRAM_BOT_TOKEN')
  };
  Logger.log(JSON.stringify(info, null, 2));
  return info;
}

// ─── Config ────────────────────────────────────────────────────────────────

function getBotProp_(key) {
  return PropertiesService.getScriptProperties().getProperty(key) || '';
}

function configureBotSecrets(cfg) {
  cfg = cfg || {};
  const props = PropertiesService.getScriptProperties();
  if (cfg.lineChannelAccessToken) props.setProperty('LINE_CHANNEL_ACCESS_TOKEN', cfg.lineChannelAccessToken);
  if (cfg.lineChannelSecret) props.setProperty('LINE_CHANNEL_SECRET', cfg.lineChannelSecret);
  if (cfg.telegramBotToken) props.setProperty('TELEGRAM_BOT_TOKEN', cfg.telegramBotToken);
  if (cfg.webAppUrl) props.setProperty('WEB_APP_URL', cfg.webAppUrl);
  if (cfg.webhookUrl) props.setProperty('WEBHOOK_URL', String(cfg.webhookUrl).replace(/\/dev$/, '/exec'));
  if (cfg.botWebhookSecret) props.setProperty('BOT_WEBHOOK_SECRET', cfg.botWebhookSecret);
  ensureNotifySheet_();
  return { success: true, message: 'บันทึก bot secrets แล้ว' };
}

function getWebAppDeployUrl_() {
  const stored = getBotProp_('WEBHOOK_URL');
  if (stored) return stored.replace(/\/dev$/, '/exec').replace(/\/$/, '');
  try {
    return ScriptApp.getService().getUrl().replace(/\/dev$/, '/exec').replace(/\/$/, '');
  } catch (e) {
    return '';
  }
}

function resolveTelegramPostUrl_(execUrl) {
  execUrl = String(execUrl || getWebAppDeployUrl_()).replace(/\/dev$/, '/exec').replace(/\/$/, '');
  if (!execUrl) return '';

  const cached = getBotProp_('TELEGRAM_POST_URL');
  if (cached) return cached;

  try {
    const res = UrlFetchApp.fetch(execUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ update_id: -999999 }),
      followRedirects: false,
      muteHttpExceptions: true
    });
    const code = res.getResponseCode();
    if (code >= 300 && code < 400) {
      const headers = res.getAllHeaders();
      const loc = headers['Location'] || headers['location'];
      if (loc) {
        PropertiesService.getScriptProperties().setProperty('TELEGRAM_POST_URL', loc);
        return loc;
      }
    }
    if (code === 200) {
      PropertiesService.getScriptProperties().setProperty('TELEGRAM_POST_URL', execUrl);
      return execUrl;
    }
  } catch (err) {
    Logger.log('resolveTelegramPostUrl_: ' + err.message);
  }
  return execUrl;
}

function normalizeWebhookUrl_(url) {
  return String(url || '').replace(/\/dev$/, '/exec').replace(/\/$/, '');
}

function probeTelegramWebhookPost_(url) {
  url = normalizeWebhookUrl_(url);
  if (!url) return { ok: false, error: 'no url' };
  try {
    const res = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ update_id: -999999 }),
      followRedirects: true,
      muteHttpExceptions: true
    });
    return {
      url: url,
      code: res.getResponseCode(),
      body: res.getContentText().substring(0, 120)
    };
  } catch (err) {
    return { url: url, ok: false, error: err.message };
  }
}

function buildBotWebhookUrl_() {
  return getWebAppDeployUrl_();
}

function buildLineWebhookUrl_() {
  return getWebAppDeployUrl_();
}

function buildTelegramWebhookUrl_() {
  return resolveTelegramPostUrl_(getWebAppDeployUrl_()) || getWebAppDeployUrl_();
}

function isWebhookAuthorized_(platform, params, body) {
  body = body || {};
  if (platform === 'line' && Array.isArray(body.events)) return true;
  if (platform === 'telegram' && body.update_id !== undefined) return true;
  const expectedKey = getBotProp_('BOT_WEBHOOK_SECRET');
  const providedKey = String(params.key || '');
  if (expectedKey && providedKey && providedKey === expectedKey) return true;
  return false;
}

function getWebhookParams_(e) {
  const params = {};
  e = e || {};
  if (e.parameter) {
    Object.keys(e.parameter).forEach(function(k) {
      params[k] = e.parameter[k];
    });
  }
  if (e.queryString) {
    e.queryString.split('&').forEach(function(pair) {
      const parts = pair.split('=');
      const k = decodeURIComponent(parts[0] || '');
      if (!k || params[k] !== undefined) return;
      params[k] = decodeURIComponent((parts[1] || '').replace(/\+/g, ' '));
    });
  }
  return params;
}

function detectBotPlatform_(body) {
  body = body || {};
  if (body.update_id !== undefined) return 'telegram';
  if (Array.isArray(body.events)) return 'line';
  return '';
}

function logBotWebhook_(platform, snippet, status, detail) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName('BOT_LOG');
    if (!sheet) {
      sheet = ss.insertSheet('BOT_LOG');
      sheet.appendRow(['Timestamp', 'Platform', 'Status', 'Detail', 'Snippet']);
    }
    sheet.appendRow([
      Utilities.formatDate(new Date(), TIMEZONE, 'dd/MM/yyyy HH:mm:ss'),
      platform || '-',
      status || '-',
      String(detail || '').substring(0, 500),
      String(snippet || '').substring(0, 300)
    ]);
  } catch (err) {
    Logger.log('BOT_LOG fail: ' + err.message);
  }
}

// ─── Status summary (logic เดียวกับแดชบอร์ด) ───────────────────────────────

function getActiveStepKeyFromJob_(job) {
  for (let i = 0; i < job.steps.length; i++) {
    if (job.steps[i].value !== 'YES') return job.steps[i].key;
  }
  return '__complete__';
}

function parseJobUpdatedAt_(text) {
  if (!text) return null;
  try {
    const m = String(text).match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
    if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4]), Number(m[5]));
    return new Date(text);
  } catch (e) {
    return null;
  }
}

function getStatusSummary_() {
  const jobs = getData_();
  const steps = STEP_CONFIG.map((step, index) => ({
    num: index + 1,
    key: step.key,
    label: step.label,
    count: jobs.filter(j => getActiveStepKeyFromJob_(j) === step.key).length
  }));

  let lastUpdated = null;
  jobs.forEach(j => {
    const d = parseJobUpdatedAt_(j.updatedAt);
    if (d && (!lastUpdated || d > lastUpdated)) lastUpdated = d;
  });

  const now = new Date();
  return {
    totalJobs: jobs.length,
    completeJobs: jobs.filter(j => j.isComplete).length,
    steps,
    lastUpdatedText: lastUpdated
      ? Utilities.formatDate(lastUpdated, TIMEZONE, 'dd/MM/yyyy HH:mm')
      : '-',
    generatedAt: Utilities.formatDate(now, TIMEZONE, 'dd/MM/yyyy HH:mm')
  };
}

// ─── NOTIFY sheet ───────────────────────────────────────────────────────────

function ensureNotifySheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(NOTIFY_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(NOTIFY_SHEET_NAME);

  const header = ['Label', 'Platform', 'TargetId', 'DailyPush', 'Active', 'Note'];
  const row1 = sheet.getRange(1, 1, 1, header.length).getValues()[0];
  if (row1.join('|') !== header.join('|')) {
    sheet.getRange(1, 1, 1, header.length).setValues([header]);
  }
  return sheet;
}

function getNotifyTargets_() {
  ensureNotifySheet_();
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(NOTIFY_SHEET_NAME);
  if (sheet.getLastRow() < 2) return [];

  return sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues()
    .filter(row => String(row[2] || '').trim() !== '')
    .map(row => ({
      label: String(row[0] || '').trim(),
      platform: String(row[1] || '').trim().toUpperCase(),
      targetId: String(row[2] || '').trim(),
      dailyPush: normalizeYesNo_(row[3]) === 'YES',
      active: normalizeYesNo_(row[4]) === 'YES',
      note: String(row[5] || '').trim()
    }));
}

function upsertNotifyTarget_(platform, targetId, label) {
  if (!targetId) return;
  const sheet = ensureNotifySheet_();
  const data = sheet.getDataRange().getValues();
  platform = String(platform || '').toUpperCase();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).toUpperCase() === platform && String(data[i][2]) === targetId) {
      if (label && !data[i][0]) sheet.getRange(i + 1, 1).setValue(label);
      return;
    }
  }

  sheet.appendRow([label || platform + ' user', platform, targetId, 'NO', 'NO', 'ลงทะเบียนอัตโนมัติจาก bot']);
}

// ─── Message builders ───────────────────────────────────────────────────────

function getWebAppUrl_() {
  return getBotProp_('WEB_APP_URL') || '';
}

function buildTelegramSummaryHtml_(summary, webUrl) {
  const lines = [
    '📊 <b>สรุปสถานะงาน PEA Tracking</b>',
    ''
  ];
  summary.steps.forEach(s => {
    lines.push(s.num + '.' + s.label + '  <b>' + s.count + '</b> งาน');
  });
  lines.push('');
  lines.push('งานทั้งหมด: <b>' + summary.totalJobs + '</b>  |  ครบทุกขั้น: <b>' + summary.completeJobs + '</b>');
  lines.push('อัปเดตล่าสุด: ' + summary.lastUpdatedText);
  lines.push('สร้างเมื่อ: ' + summary.generatedAt);
  if (webUrl) lines.push('', '🔗 <a href="' + webUrl + '">เปิดเว็บแอพ (ล็อกอิน)</a>');
  return lines.join('\n');
}

function buildTelegramKeyboard_(webUrl) {
  if (!webUrl) return null;
  return {
    inline_keyboard: [[
      { text: '🌐 เปิดเว็บแอพ', url: webUrl }
    ], [
      { text: '📊 สรุปสถานะ', callback_data: 'summary' }
    ]]
  };
}

function buildLineFlexSummaryMessage_(summary, webUrl) {
  const stepRows = summary.steps.map(s => ({
    type: 'box',
    layout: 'horizontal',
    contents: [
      { type: 'text', text: s.num + '.' + s.label, size: 'xs', color: '#555555', flex: 4, wrap: true },
      { type: 'text', text: String(s.count), size: 'sm', weight: 'bold', color: '#1f3a5f', align: 'end', flex: 1 }
    ],
    margin: 'sm'
  }));

  const bodyContents = [
    { type: 'text', text: 'สรุปสถานะงาน', weight: 'bold', size: 'lg', color: '#1f3a5f' },
    { type: 'text', text: 'PEA Tracking', size: 'xs', color: '#aaaaaa', margin: 'xs' },
    { type: 'separator', margin: 'md' }
  ].concat(stepRows);

  bodyContents.push({
    type: 'box',
    layout: 'vertical',
    margin: 'lg',
    spacing: 'xs',
    contents: [
      { type: 'text', text: 'งานทั้งหมด ' + summary.totalJobs + '  |  ครบ ' + summary.completeJobs, size: 'xs', color: '#888888' },
      { type: 'text', text: 'อัปเดตล่าสุด: ' + summary.lastUpdatedText, size: 'xs', color: '#888888' },
      { type: 'text', text: 'สร้างเมื่อ: ' + summary.generatedAt, size: 'xs', color: '#aaaaaa' }
    ]
  });

  if (webUrl) {
    bodyContents.push({
      type: 'button',
      style: 'primary',
      color: '#1f3a5f',
      margin: 'lg',
      action: { type: 'uri', label: 'เปิดเว็บแอพ', uri: webUrl }
    });
  }

  return {
    type: 'flex',
    altText: 'สรุปสถานะงาน ' + summary.generatedAt,
    contents: {
      type: 'bubble',
      size: 'mega',
      body: { type: 'box', layout: 'vertical', contents: bodyContents }
    }
  };
}

function buildLineTextWithQuickReply_(text) {
  return {
    type: 'text',
    text: text,
    quickReply: {
      items: [{
        type: 'action',
        action: { type: 'message', label: SUMMARY_KEYWORD, text: SUMMARY_KEYWORD }
      }]
    }
  };
}

// ─── LINE API ───────────────────────────────────────────────────────────────

function lineApi_(path, payload) {
  const token = getBotProp_('LINE_CHANNEL_ACCESS_TOKEN');
  if (!token) throw new Error('ยังไม่ได้ตั้ง LINE_CHANNEL_ACCESS_TOKEN');
  const res = UrlFetchApp.fetch('https://api.line.me/v2/bot' + path, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  const code = res.getResponseCode();
  const body = res.getContentText();
  if (code < 200 || code >= 300) throw new Error('LINE API ' + code + ': ' + body);
  return body ? JSON.parse(body) : {};
}

function lineReply_(replyToken, messages) {
  return lineApi_('/message/reply', { replyToken, messages });
}

function linePush_(to, messages) {
  return lineApi_('/message/push', { to, messages });
}

function sendLineSummary_(replyToken, userId) {
  const summary = getStatusSummary_();
  const webUrl = getWebAppUrl_();
  const flex = buildLineFlexSummaryMessage_(summary, webUrl);
  const hint = buildLineTextWithQuickReply_('กด "' + SUMMARY_KEYWORD + '" ได้ทุกเมื่อ');

  if (replyToken) {
    try {
      lineReply_(replyToken, [flex, hint]);
    } catch (err) {
      logBotWebhook_('LINE', SUMMARY_KEYWORD, 'flex reply fail', err.message);
      const text = buildLinePlainSummaryText_(summary, webUrl);
      lineReply_(replyToken, [buildLineTextWithQuickReply_(text)]);
    }
  } else if (userId) {
    linePush_(userId, [flex]);
  }
}

function buildLinePlainSummaryText_(summary, webUrl) {
  const lines = ['สรุปสถานะงาน PEA Tracking', ''];
  summary.steps.forEach(function(s) {
    lines.push(s.num + '.' + s.label + '  ' + s.count + ' งาน');
  });
  lines.push('');
  lines.push('งานทั้งหมด ' + summary.totalJobs + ' | อัปเดตล่าสุด ' + summary.lastUpdatedText);
  if (webUrl) lines.push('เปิดเว็บ: ' + webUrl);
  return lines.join('\n');
}

function handleLineWebhook_(body) {
  const events = body.events || [];
  logBotWebhook_('LINE', JSON.stringify(body).substring(0, 200), 'events=' + events.length, '');

  events.forEach(function(event) {
    try {
      if (event.type === 'follow') {
        const userId = event.source.userId;
        upsertNotifyTarget_('LINE', userId, 'LINE follower');
        if (event.replyToken) {
          lineReply_(event.replyToken, [
            buildLineTextWithQuickReply_('สวัสดีครับ 👋\nกด "' + SUMMARY_KEYWORD + '" เพื่อดูจำนวนงานแต่ละสถานะ\n\nPush รายวัน: ตั้ง DailyPush=YES ในชีต NOTIFY')
          ]);
        }
        return;
      }

      if (event.type !== 'message' || !event.message || event.message.type !== 'text') return;

      const userId = event.source.userId;
      const text = String(event.message.text || '').trim();
      upsertNotifyTarget_('LINE', userId, '');

      if (isSummaryRequest_(text)) {
        sendLineSummary_(event.replyToken, null);
      } else {
        lineReply_(event.replyToken, [
          buildLineTextWithQuickReply_('พิมพ์ "' + SUMMARY_KEYWORD + '" เพื่อดูสรุปงานแต่ละสถานะ (1-10)')
        ]);
      }
    } catch (err) {
      logBotWebhook_('LINE', String(event.message && event.message.text || event.type), 'event error', err.message);
      try {
        if (event.replyToken) {
          lineReply_(event.replyToken, [{ type: 'text', text: 'เกิดข้อผิดพลาด: ' + err.message }]);
        }
      } catch (ignore) {}
    }
  });

  return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
}

// ─── Telegram API ───────────────────────────────────────────────────────────

function telegramApi_(method, payload) {
  const token = getBotProp_('TELEGRAM_BOT_TOKEN');
  if (!token) throw new Error('ยังไม่ได้ตั้ง TELEGRAM_BOT_TOKEN');
  const res = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/' + method, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  const code = res.getResponseCode();
  const body = JSON.parse(res.getContentText());
  if (code < 200 || code >= 300 || !body.ok) {
    throw new Error('Telegram API: ' + (body.description || res.getContentText()));
  }
  return body.result;
}

function telegramGetUpdates_(offset) {
  try {
    return telegramApi_('getUpdates', {
      offset: offset,
      timeout: 0,
      allowed_updates: ['message', 'callback_query']
    });
  } catch (err) {
    if (String(err.message).indexOf('Conflict') >= 0) {
      logBotWebhook_('TELEGRAM', '', 'getUpdates conflict', err.message);
      return [];
    }
    throw err;
  }
}

function buildTelegramPlainSummary_(summary, webUrl) {
  const lines = ['📊 สรุปสถานะงาน PEA Tracking', ''];
  summary.steps.forEach(function(s) {
    lines.push(s.num + '.' + s.label + '  ' + s.count + ' งาน');
  });
  lines.push('');
  lines.push('งานทั้งหมด: ' + summary.totalJobs + '  |  ครบทุกขั้น: ' + summary.completeJobs);
  lines.push('อัปเดตล่าสุด: ' + summary.lastUpdatedText);
  lines.push('สร้างเมื่อ: ' + summary.generatedAt);
  if (webUrl) lines.push('', '🔗 เปิดเว็บ: ' + webUrl);
  return lines.join('\n');
}

function telegramSendSummary_(chatId) {
  const summary = getStatusSummary_();
  const webUrl = getWebAppUrl_();
  const keyboard = buildTelegramKeyboard_(webUrl);
  try {
    telegramApi_('sendMessage', {
      chat_id: chatId,
      text: buildTelegramSummaryHtml_(summary, webUrl),
      parse_mode: 'HTML',
      disable_web_page_preview: false,
      reply_markup: keyboard
    });
  } catch (err) {
    logBotWebhook_('TELEGRAM', String(chatId), 'HTML send fail', err.message);
    telegramApi_('sendMessage', {
      chat_id: chatId,
      text: buildTelegramPlainSummary_(summary, webUrl),
      reply_markup: keyboard
    });
  }
}

function normalizeTelegramCommand_(text) {
  return String(text || '').trim().split('@')[0].trim();
}

function isSummaryRequest_(text) {
  const raw = String(text || '').trim();
  const cmd = normalizeTelegramCommand_(raw).toLowerCase();
  if (cmd === '/summary' || cmd === 'summary') return true;
  if (raw.toLowerCase() === 'summary') return true;
  if (raw === SUMMARY_KEYWORD || raw === SUMMARY_KEYWORD_ALT) return true;
  return false;
}

function isTelegramGroupChat_(chat) {
  const type = chat && chat.type;
  return type === 'group' || type === 'supergroup';
}

function buildTelegramHelpText_(chat) {
  if (isTelegramGroupChat_(chat)) {
    return 'ในกลุ่ม: ใช้ /summary หรือกดปุ่ม "📊 สรุปสถานะ" ใต้ข้อความ bot\n' +
      '(อยากพิมพ์ "' + SUMMARY_KEYWORD + '" ในกลุ่ม → BotFather → Bot Settings → Group Privacy → Turn off)';
  }
  return 'ใช้ /summary หรือพิมพ์ "' + SUMMARY_KEYWORD + '" / "' + SUMMARY_KEYWORD_ALT + '"';
}

function setupTelegramCommands_() {
  try {
    telegramApi_('setMyCommands', {
      commands: [
        { command: 'start', description: 'เริ่มใช้งาน bot' },
        { command: 'summary', description: 'สรุปสถานะงาน 1-10' }
      ]
    });
  } catch (err) {
    Logger.log('setMyCommands fail: ' + err.message);
  }
}

function processTelegramUpdate_(update, source) {
  source = source || 'webhook';
  if (!update || update.update_id === -999999) return;

  logBotWebhook_('TELEGRAM', JSON.stringify(update).substring(0, 200), source, '');

  if (update.callback_query) {
    const cq = update.callback_query;
    if (cq.data === 'summary' && cq.message && cq.message.chat) {
      telegramSendSummary_(cq.message.chat.id);
      telegramApi_('answerCallbackQuery', { callback_query_id: cq.id });
    }
    return;
  }

  const msg = update.message;
  if (!msg || !msg.chat) return;

  const chatId = msg.chat.id;
  const text = String(msg.text || '').trim();
  const cmd = normalizeTelegramCommand_(text);
  const chatLabel = msg.chat.title || (msg.from && msg.from.username) || (msg.from && msg.from.first_name) || String(chatId);

  logBotWebhook_('TELEGRAM', text, 'message', 'chatId=' + chatId + ' cmd=' + cmd + ' via=' + source);

  upsertNotifyTarget_('TELEGRAM', String(chatId), chatLabel);

  if (cmd === '/start') {
    const groupHint = isTelegramGroupChat_(msg.chat)
      ? '\n\n📌 ในกลุ่มใช้ /summary (Telegram ไม่ส่งข้อความไทยให้ bot ในกลุ่มโดย default)'
      : '';
    telegramApi_('sendMessage', {
      chat_id: chatId,
      text: '👋 สวัสดีครับ PEA Tracking Bot\n\n' + buildTelegramHelpText_(msg.chat) +
        '\nPush รายวัน: ตั้ง DailyPush=YES ในชีต NOTIFY' + groupHint,
      reply_markup: buildTelegramKeyboard_(getWebAppUrl_())
    });
  } else if (isSummaryRequest_(text)) {
    telegramSendSummary_(chatId);
  } else if (text) {
    telegramApi_('sendMessage', {
      chat_id: chatId,
      text: buildTelegramHelpText_(msg.chat),
      reply_markup: buildTelegramKeyboard_(getWebAppUrl_())
    });
  }
}

function handleTelegramWebhook_(body) {
  try {
    if (body.update_id === -999999) {
      return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
    }
    processTelegramUpdate_(body, 'webhook');
  } catch (err) {
    logBotWebhook_('TELEGRAM', '', 'handler error', err.message);
    try {
      const chatId = body.message && body.message.chat && body.message.chat.id;
      if (chatId) {
        telegramApi_('sendMessage', { chat_id: chatId, text: 'เกิดข้อผิดพลาด: ' + err.message });
      }
    } catch (ignore) {}
  }

  return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
}

function removeTelegramPollTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    const fn = t.getHandlerFunction();
    if (fn === 'pollTelegramUpdates_' || fn === 'pollTelegramUpdatesLoop_') {
      ScriptApp.deleteTrigger(t);
    }
  });
}

function stopTelegramPolling() {
  PropertiesService.getScriptProperties().setProperty('TELEGRAM_MODE', 'off');
  removeTelegramPollTriggers_();
  return {
    success: true,
    message: 'หยุด polling แล้ว — รอ 1 นาทีให้ process เก่าจบ แล้ว Run enableTelegramPolling()'
  };
}

function pollTelegramUpdates_() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('TELEGRAM_MODE') !== 'polling') return { processed: 0 };

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(8000)) {
    logBotWebhook_('TELEGRAM', '', 'poll skip', 'lock busy');
    return { processed: 0, skipped: true };
  }

  try {
    let offset = parseInt(props.getProperty('TELEGRAM_UPDATE_OFFSET') || '0', 10);
    const updates = telegramGetUpdates_(offset);

    if (!updates || !updates.length) return { processed: 0 };

    updates.forEach(function(update) {
      try {
        processTelegramUpdate_(update, 'poll');
      } catch (err) {
        logBotWebhook_('TELEGRAM', String(update.update_id), 'poll error', err.message);
      }
      offset = update.update_id + 1;
    });
    props.setProperty('TELEGRAM_UPDATE_OFFSET', String(offset));
    return { processed: updates.length };
  } finally {
    lock.releaseLock();
  }
}

function pollTelegramUpdatesLoop_() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('TELEGRAM_MODE') !== 'polling') return;

  for (let i = 0; i < TELEGRAM_POLL_ROUNDS; i++) {
    pollTelegramUpdates_();
    if (i < TELEGRAM_POLL_ROUNDS - 1) {
      Utilities.sleep(TELEGRAM_POLL_INTERVAL_SEC * 1000);
    }
  }
}

function enableTelegramPolling() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('TELEGRAM_MODE', 'off');
  removeTelegramPollTriggers_();
  Utilities.sleep(3000);

  telegramApi_('deleteWebhook', { drop_pending_updates: false });
  Utilities.sleep(2000);

  const webhookInfo = getTelegramWebhookInfo();
  if (webhookInfo.url) {
    logBotWebhook_('TELEGRAM', webhookInfo.url, 'webhook still set', webhookInfo.last_error_message || '');
  }

  props.setProperty('TELEGRAM_MODE', 'polling');
  props.deleteProperty('TELEGRAM_UPDATE_OFFSET');

  ScriptApp.newTrigger('pollTelegramUpdatesLoop_')
    .timeBased()
    .everyMinutes(1)
    .create();

  setupTelegramCommands_();

  return {
    success: true,
    mode: 'polling',
    message: 'ตั้ง polling แล้ว (ทุก ' + TELEGRAM_POLL_INTERVAL_SEC + ' วินาที) — ทดสอบ /summary ได้เลย',
    webhookInfo: webhookInfo,
    note: 'ถ้าเคย error Conflict → Run stopTelegramPolling() รอ 1 นาที แล้ว enableTelegramPolling() อีกครั้ง'
  };
}

function pollTelegramNow() {
  const result = pollTelegramUpdates_();
  return {
    success: true,
    processed: result.processed,
    message: result.processed ? 'ประมวลผล ' + result.processed + ' ข้อความแล้ว' : 'ไม่มีข้อความค้าง'
  };
}

function enableTelegramWebhook(explicitUrl) {
  removeTelegramPollTriggers_();
  PropertiesService.getScriptProperties().setProperty('TELEGRAM_MODE', 'webhook');
  return setTelegramWebhook(explicitUrl);
}

function setTelegramWebhook(explicitUrl) {
  const execUrl = normalizeWebhookUrl_(explicitUrl || getWebAppDeployUrl_());
  if (!execUrl) {
    throw new Error('ตั้ง webhookUrl ใน configureBotSecrets หรือ deploy Web App ก่อน');
  }

  PropertiesService.getScriptProperties().deleteProperty('TELEGRAM_POST_URL');
  const redirectUrl = resolveTelegramPostUrl_(execUrl);
  const candidates = [];
  if (redirectUrl && candidates.indexOf(redirectUrl) < 0) candidates.push(redirectUrl);
  if (execUrl && candidates.indexOf(execUrl) < 0) candidates.push(execUrl);

  telegramApi_('deleteWebhook', { drop_pending_updates: false });

  let chosen = execUrl;
  let info = null;
  for (let i = 0; i < candidates.length; i++) {
    const url = candidates[i];
    telegramApi_('setWebhook', {
      url: url,
      allowed_updates: ['message', 'callback_query'],
      drop_pending_updates: i === 0
    });
    Utilities.sleep(1500);
    info = getTelegramWebhookInfo();
    chosen = url;
    if (!info.last_error_message) break;
    logBotWebhook_('TELEGRAM', url, 'setWebhook retry', info.last_error_message);
  }

  info = getTelegramWebhookInfo();
  PropertiesService.getScriptProperties().setProperty('TELEGRAM_POST_URL', chosen);
  const matched = normalizeWebhookUrl_(info.url) === normalizeWebhookUrl_(chosen);
  logBotWebhook_('TELEGRAM', chosen, 'setWebhook final', JSON.stringify(info));
  return {
    success: !info.last_error_message,
    url: chosen,
    execUrl: execUrl,
    redirectUrl: redirectUrl,
    webhookInfo: info,
    warning: info.last_error_message || (matched ? null : 'Telegram รายงาน URL: ' + (info.url || '(ว่าง)'))
  };
}

function getTelegramWebhookInfo() {
  return telegramApi_('getWebhookInfo', {});
}

function diagnoseBotWebhook() {
  const execUrl = getWebAppDeployUrl_();
  const tgUrl = buildTelegramWebhookUrl_();
  const result = {
    deployUrl: execUrl,
    telegramPostUrl: tgUrl,
    webhookUrlProperty: getBotProp_('WEBHOOK_URL') || '(ไม่ได้ตั้ง — ใช้ ScriptApp.getService().getUrl())',
    lineWebhookUrl: buildLineWebhookUrl_(),
    hasLineToken: !!getBotProp_('LINE_CHANNEL_ACCESS_TOKEN'),
    hasTelegramToken: !!getBotProp_('TELEGRAM_BOT_TOKEN'),
    hasWebhookSecret: !!getBotProp_('BOT_WEBHOOK_SECRET'),
    webAppUrl: getWebAppUrl_()
  };

  try {
    const pingLine = UrlFetchApp.fetch(result.lineWebhookUrl, { muteHttpExceptions: true, followRedirects: true });
    result.linePingCode = pingLine.getResponseCode();
    result.linePingBody = pingLine.getContentText().substring(0, 100);
  } catch (err) {
    result.linePingError = err.message;
  }

  try {
    result.telegramWebhookInfo = getTelegramWebhookInfo();
    if (result.telegramWebhookInfo.last_error_message) {
      result.telegramWebhookHint = 'Telegram ส่ง webhook ไม่สำเร็จ: ' + result.telegramWebhookInfo.last_error_message;
    }
  } catch (err) {
    result.telegramWebhookError = err.message;
  }

  try {
    result.telegramPostProbe = probeTelegramWebhookPost_(tgUrl || execUrl);
  } catch (err) {
    result.telegramPostProbeError = err.message;
  }

  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

// ─── Daily push ─────────────────────────────────────────────────────────────

function sendDailyStatusPush() {
  const summary = getStatusSummary_();
  const webUrl = getWebAppUrl_();
  const targets = getNotifyTargets_().filter(t => t.active && t.dailyPush);
  const results = [];

  targets.forEach(t => {
    try {
      if (t.platform === 'LINE') {
        linePush_(t.targetId, [buildLineFlexSummaryMessage_(summary, webUrl)]);
        results.push({ target: t.label, platform: 'LINE', ok: true });
      } else if (t.platform === 'TELEGRAM') {
        telegramApi_('sendMessage', {
          chat_id: t.targetId,
          text: '📅 <b>สรุปประจำวัน</b>\n\n' + buildTelegramSummaryHtml_(summary, webUrl),
          parse_mode: 'HTML',
          reply_markup: buildTelegramKeyboard_(webUrl)
        });
        results.push({ target: t.label, platform: 'TELEGRAM', ok: true });
      }
    } catch (err) {
      results.push({ target: t.label, platform: t.platform, ok: false, error: err.message });
      Logger.log('Daily push fail ' + t.targetId + ': ' + err.message);
    }
  });

  Logger.log('Daily push done: ' + JSON.stringify(results));
  return { success: true, sent: results.filter(r => r.ok).length, total: targets.length, results };
}

function installDailyPushTrigger(hour) {
  hour = hour == null ? 8 : Number(hour);
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'sendDailyStatusPush') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('sendDailyStatusPush')
    .timeBased()
    .everyDays(1)
    .atHour(hour)
    .inTimezone(TIMEZONE)
    .create();
  return { success: true, hour, timezone: TIMEZONE };
}

function testSendDailyPush() {
  return sendDailyStatusPush();
}

function showDailyPushSetupGuide() {
  const guide = {
    sheet: 'NOTIFY',
    columns: {
      Label: 'ชื่อเรียก เช่น ทีม NPN',
      Platform: 'LINE หรือ TELEGRAM',
      TargetId: 'LINE=userId (U...) | TELEGRAM=chatId (กลุ่ม=-xxx ส่วนตัว=xxx)',
      DailyPush: 'YES = รับ push รายวัน',
      Active: 'YES = เปิดใช้งาน',
      Note: 'หมายเหตุ'
    },
    line: [
      '1. ให้ user แอด LINE bot เป็นเพื่อน หรือพิมพ์ "สรุปสถานะ" ครั้งหนึ่ง',
      '2. ชีต NOTIFY จะเพิ่มแถวอัตโนมัติ (Platform=LINE, TargetId=U...)',
      '3. ตั้ง DailyPush=YES และ Active=YES ในแถวนั้น'
    ],
    telegram: [
      '1. พิมพ์ /summary ในกลุ่มหรือแชทส่วนตัว — NOTIFY จะเพิ่มแถวอัตโนมัติ',
      '2. กลุ่ม: TargetId เป็นเลขติดลบ เช่น -5122822245',
      '3. ส่วนตัว: TargetId เป็นเลขบวก เช่น 7792601755',
      '4. ตั้ง DailyPush=YES และ Active=YES'
    ],
    schedule: [
      'Run installDailyPushTrigger(8) — push ทุกวัน 08:00 น. (เปลี่ยนเลขได้)',
      'Run testSendDailyPush() — ทดสอบส่งทันที'
    ],
    currentTargets: getNotifyTargets_()
  };
  Logger.log(JSON.stringify(guide, null, 2));
  return guide;
}

function testSimulateLineWebhook() {
  const body = {
    events: [{
      type: 'message',
      replyToken: 'TEST_TOKEN_WILL_FAIL',
      source: { userId: 'U_TEST_USER' },
      message: { type: 'text', text: SUMMARY_KEYWORD }
    }]
  };
  const result = handleLineWebhook_(body);
  return { note: 'ดู BOT_LOG — ถ้า replyToken ปลอม LINE API จะ error แต่ handler ทำงานแล้ว', result: result.getContent() };
}

function testSimulateTelegramWebhook(chatId) {
  if (!chatId) {
    const targets = getNotifyTargets_().filter(function(t) { return t.platform === 'TELEGRAM'; });
    if (targets.length) chatId = targets[0].targetId;
  }
  if (!chatId) {
    return { success: false, error: 'ใส่ chatId หรือเพิ่มแถว TELEGRAM ในชีต NOTIFY ก่อน' };
  }
  const body = {
    update_id: 999001,
    message: {
      message_id: 1,
      chat: { id: Number(chatId) || chatId, type: 'private' },
      from: { first_name: 'Test' },
      text: '/summary'
    }
  };
  handleTelegramWebhook_(body);
  return {
    success: true,
    note: 'จำลอง handler แล้ว — ถ้าได้ข้อความใน Telegram แปลว่า token+handler OK แต่ webhook ยังไม่ชี้มา',
    chatId: chatId
  };
}

function repairAllBots() {
  const urls = showBotWebhookUrls();
  const tg = enableTelegramPolling();
  return {
    success: true,
    message: 'LINE: ตั้ง webhook URL ใน LINE Developers | Telegram: เปิด polling แล้ว (ไม่ใช้ webhook)',
    lineWebhookUrl: urls.lineWebhookUrl,
    telegram: tg
  };
}

function testBotSummaryReply() {
  const summary = getStatusSummary_();
  return {
    success: true,
    summary,
    lineWebhookUrl: buildBotWebhookUrl_(),
    telegramWebhookUrl: buildBotWebhookUrl_(),
    notifyTargets: getNotifyTargets_()
  };
}

// ─── Webhook router (เรียกจาก doPost ใน Code.gs) ───────────────────────────

function handleBotWebhook_(e, platform, params, body, raw) {
  params = params || getWebhookParams_(e);
  body = body || {};
  raw = raw || ((e.postData && e.postData.contents) ? e.postData.contents : '');

  if (!platform) platform = String(params.bot || detectBotPlatform_(body)).toLowerCase();

  logBotWebhook_(platform, raw.substring(0, 200), 'incoming',
    'pathInfo=' + (e.pathInfo || '-') + ' key=' + (params.key ? 'yes' : 'no'));

  if (!isWebhookAuthorized_(platform, params, body)) {
    logBotWebhook_(platform, raw.substring(0, 200), 'Unauthorized',
      'platform=' + platform + ' — ต้อง deploy โค้ดล่าสุด');
    return ContentService.createTextOutput('Unauthorized').setMimeType(ContentService.MimeType.TEXT);
  }

  try {
    if (platform === 'line') return handleLineWebhook_(body);
    if (platform === 'telegram') return handleTelegramWebhook_(body);
    return ContentService.createTextOutput('Unknown bot').setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    logBotWebhook_(platform, raw.substring(0, 200), 'handler crash', err.message);
    return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
  }
}
