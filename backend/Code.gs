/**
 * منصة مستهل — الخادم (Google Apps Script)
 * تخزين البيانات في Google Sheet، وواجهة JSON بسيطة تستخدمها صفحتا المنصة وحضور الطلاب على GitHub Pages.
 *
 * التشغيل مرة واحدة:
 *  1) غيّر الرمزين أدناه.
 *  2) شغّل الدالة setup() من المحرر (تنشئ جدول البيانات وتزرع الأعضاء والتفعيلات الحالية).
 *  3) Deploy → New deployment → Web app → Execute as: Me · Who has access: Anyone → انسخ رابط /exec وضعه في js/config.js
 */
const TEAM_PIN  = 'mustahal2026';   // رمز الأعضاء (غيّره)
const ADMIN_PIN = 'admin2026';      // رمز الإدارة: أنهار ومحمد (غيّره)
const EXEC = ['m-anhar', 'm-mohammed'];
const COLS = ['members','ideas','votes','tasks','students','events','attendance','boards'];
const ADMIN_ONLY = { // عمليات تحتاج رمز الإدارة
  tasks:   d => d && ['assigned','done'].includes(d.status),
  ideas:   d => d && d.status === 'closed',
  members: () => true,
  boards:  () => true,
  events:  () => false,
};

function ss_() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('SHEET_ID');
  if (!id) { const ss = SpreadsheetApp.create('منصة مستهل — البيانات'); id = ss.getId(); props.setProperty('SHEET_ID', id); }
  return SpreadsheetApp.openById(id);
}
function sheet_(name) {
  const ss = ss_(); let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(['id','json','updatedAt']); }
  return sh;
}
function readCol_(name) {
  const sh = sheet_(name); const last = sh.getLastRow(); if (last < 2) return [];
  return sh.getRange(2,1,last-1,2).getValues().filter(r => r[0]).map(r => { try { return Object.assign({id:String(r[0])}, JSON.parse(r[1])); } catch(e) { return null; } }).filter(Boolean);
}
function findRow_(sh, id) {
  const last = sh.getLastRow(); if (last < 2) return 0;
  const ids = sh.getRange(2,1,last-1,1).getValues();
  for (let i=0;i<ids.length;i++) if (String(ids[i][0])===String(id)) return i+2;
  return 0;
}
function write_(col, id, data, merge) {
  const sh = sheet_(col); const row = findRow_(sh, id); const now = new Date().toISOString();
  let body = data || {};
  if (merge && row) { try { body = Object.assign(JSON.parse(sh.getRange(row,2).getValue()), data); } catch(e) {} }
  delete body.id; delete body._statusChange;
  if (row) sh.getRange(row,1,1,3).setValues([[id, JSON.stringify(body), now]]); else sh.appendRow([id, JSON.stringify(body), now]);
}
function remove_(col, id) { const sh = sheet_(col); const row = findRow_(sh, id); if (row) sh.deleteRow(row); }

function out_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'public') return out_({ ok:true, boards: readCol_('boards') });
  return out_({ ok:false, error:'use_post' }); // القراءة الكاملة عبر POST فقط حتى لا يظهر الرمز في الرابط
}

function doPost(e) {
  let req = {};
  try { req = JSON.parse(e.postData.contents); } catch(err) { return out_({ ok:false, error:'bad_json' }); }
  if (req.action === 'register') return register_(req); // تسجيل عام للطلاب بلا رمز
  const isAdmin = req.admin === ADMIN_PIN;
  if (req.pin !== TEAM_PIN && !isAdmin) return out_({ ok:false, error:'pin' });
  if (req.action === 'all') { const data = {}; COLS.forEach(c => data[c] = readCol_(c)); return out_({ ok:true, data, serverTime: new Date().toISOString() }); }
  if (!COLS.includes(req.col) || !req.id || !/^[\w\-:.@+؀-ۿ]+$/.test(req.id)) return out_({ ok:false, error:'bad_request' });
  const needsAdmin = (req.action === 'delete' && req.col !== 'votes') || (ADMIN_ONLY[req.col] && ADMIN_ONLY[req.col](req.data));
  if (needsAdmin && !isAdmin) return out_({ ok:false, error:'admin' });
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    if (req.action === 'set') write_(req.col, req.id, req.data, false);
    else if (req.action === 'update') write_(req.col, req.id, req.data, true);
    else if (req.action === 'delete') remove_(req.col, req.id);
    else return out_({ ok:false, error:'bad_action' });
  } finally { lock.releaseLock(); }
  return out_({ ok:true });
}

/** تسجيل حضور الطلاب في الفعاليات (صفحة rsvp على الموقع): الاسم، الجوال، تأكيد الحضور */
const REG_SHEET = 'التسجيل';
function register_(req) {
  if (req.hp) return out_({ ok:true }); // فخ للروبوتات: حقل مخفي امتلأ
  const ev = String(req.event || '').trim().slice(0, 60);
  const name = String(req.name || '').replace(/\s+/g, ' ').trim();
  const phoneRaw = String(req.phone || '').replace(/[\s\-()]/g, '');
  const confirm = ['yes','maybe'].includes(req.confirm) ? req.confirm : '';
  if (!/^[\w\-]{2,60}$/.test(ev)) return out_({ ok:false, error:'event' });
  if (name.length < 3 || name.length > 60) return out_({ ok:false, error:'name' });
  const phone = phoneRaw.replace(/^(\+?966|00966)/, '0');
  if (!/^05\d{8}$/.test(phone)) return out_({ ok:false, error:'phone' });
  if (!confirm) return out_({ ok:false, error:'confirm' });
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const ss = ss_(); let sh = ss.getSheetByName(REG_SHEET);
    if (!sh) { sh = ss.insertSheet(REG_SHEET); sh.appendRow(['الوقت','الفعالية','الاسم','الجوال','تأكيد الحضور']); sh.setFrozenRows(1); }
    sh.getRange('D:D').setNumberFormat('@'); // الجوال نصًا حتى لا يسقط الصفر الأول
    const last = sh.getLastRow();
    const rows = last > 1 ? sh.getRange(2,1,last-1,5).getValues() : [];
    const label = confirm === 'yes' ? 'نعم، سأحضر' : 'ربما';
    const now = Utilities.formatDate(new Date(), 'Asia/Riyadh', 'yyyy-MM-dd HH:mm');
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][1]) === ev && String(rows[i][3]).replace(/^0/, '') === phone.replace(/^0/, '')) { // نفس الجوال لنفس الفعالية: تحديث لا تكرار
        sh.getRange(i+2,1,1,5).setValues([[now, ev, name, phone, label]]);
        return out_({ ok:true, updated:true });
      }
    }
    if (rows.length >= 2000) return out_({ ok:false, error:'full' });
    sh.getRange(last + 1, 1, 1, 5).setValues([[now, ev, name, phone, label]]);
  } finally { lock.releaseLock(); }
  return out_({ ok:true });
}

/** تُشغَّل مرة واحدة من المحرر */
function setup() {
  COLS.forEach(sheet_);
  if (readCol_('members').length) { Logger.log('البيانات موجودة، لم تُزرع مرة أخرى. رابط الجدول: ' + ss_().getUrl()); return; }
  const now = '2026-11-25T09:00:00Z';
  const members = [
    ['m-anhar','أنهار المالكي','شريك مؤسس ورئيس النادي','اللجنة التنفيذية',1],
    ['m-mohammed','محمد آل عطفة','شريك مؤسس ونائب الرئيس','اللجنة التنفيذية',2],
    ['m-haneen','حنين المطيري','عضو مؤسس وقائد فريق العمليات','فريق العمليات',1],
    ['m-abdulaziz','عبدالعزيز العشير','أخصائي عمليات','فريق العمليات',2],
    ['m-omar','عمر الدوسري','أخصائي عمليات','فريق العمليات',3],
    ['m-dima','ديمة الراجحي','عضو مؤسس وأخصائي تطوير برامج','فريق تطوير البرامج',1],
    ['m-rawan','روان القحطاني','عضو مؤسس وأخصائي تطوير برامج','فريق تطوير البرامج',2],
    ['m-abrar','أبرار الدوسري','عضو مؤسس وأخصائي تطوير برامج','فريق تطوير البرامج',3],
    ['m-noura','نورة الفريخ','عضو مؤسس وقائد إبداعي لاستوديو مستهل الإبداعي','استوديو مستهل الإبداعي',1],
  ];
  members.forEach(m => write_('members', m[0], {name:m[1], role:m[2], team:m[3], order:m[4], active:true}));
  write_('ideas','idea-ghanem-nov',{title:'زيارة استوديو غانم',desc:'جلسة في مكتبة الاستوديو مع الفنان غانم عن تجاربه بين المعارض والورش، وحوار مفتوح مع الطلاب.',when:'نوفمبر 2026 · استوديو الفنان',byMember:'m-mohammed',status:'closed',createdAt:'2026-11-01T09:00:00Z',selectedAt:'2026-11-03T09:00:00Z',activatedAt:'2026-11-05T09:00:00Z',closedAt:'2026-11-11T18:00:00Z',closedBy:'m-anhar'});
  write_('ideas','idea-rawan-dec',{title:'معرض «التفاحة المنفردة» مع روان',desc:'إعلان معرض عضوة النادي لطلاب المعهد، ولقاء معها في مقر المعرض تنقل فيه تجربتها من الفكرة الأولى إلى صالة العرض.',when:'الجمعة 4 ديسمبر 2026 · استوديو شعشعي',byMember:'m-rawan',status:'active',createdAt:'2026-11-15T10:00:00Z',selectedAt:now,activatedAt:now});
  write_('ideas','idea-cinema-dec',{title:'من الفكرة إلى العرض السينمائي',desc:'جلسة حوارية مع نادي سينيراما في سرد الثقافي بمناسبة يوم السينما العالمي: من الفكرة إلى الفيلم وPitch Deck، وتطبيق على مشاريع الطلاب تمهيدًا لسدوس.',when:'الأسبوع الأخير من ديسمبر 2026 · سرد الثقافي',byMember:'m-dima',status:'active',createdAt:'2026-11-15T10:05:00Z',selectedAt:now,activatedAt:now});
  write_('ideas','idea-redline-dec',{title:'معرض «خط أحمر» مع معاذ العوفي',desc:'لقاء أونلاين مع الفنان والمصور حول معرضه ودور الفنان في ظل الظروف الراهنة، بأسئلة مباشرة من الطلاب.',when:'نهاية ديسمبر 2026 · أونلاين',byMember:'m-anhar',status:'selected',createdAt:'2026-11-15T10:10:00Z',selectedAt:now});
  const done = {status:'done',approvedBy:'m-anhar',doneAt:'2026-11-11T18:00:00Z',verifiedBy:'m-anhar'};
  write_('tasks','t-ghanem-1',Object.assign({ideaId:'idea-ghanem-nov',title:'التنسيق مع الفنان غانم وتحديد الموعد',memberId:'m-mohammed',addedBy:'m-anhar',at:'2026-11-06T10:00:00Z'},done));
  write_('tasks','t-ghanem-2',Object.assign({ideaId:'idea-ghanem-nov',title:'تصميم الإعلان ونشره',memberId:'m-anhar',addedBy:'m-anhar',at:'2026-11-07T10:00:00Z'},done));
  write_('tasks','t-ghanem-3',Object.assign({ideaId:'idea-ghanem-nov',title:'ترتيب الزيارة وتنظيم الحضور',memberId:'m-mohammed',addedBy:'m-anhar',at:'2026-11-10T16:00:00Z'},done));
  write_('tasks','t-ghanem-4',Object.assign({ideaId:'idea-ghanem-nov',title:'إدارة الحوار مع الطلاب في الاستوديو',memberId:'m-mohammed',addedBy:'m-anhar',at:'2026-11-10T18:00:00Z'},done));
  write_('tasks','t-example-rawan',{ideaId:'idea-rawan-dec',title:'تجهيز قائمة الأعمال وبطاقات التعريف للجولة',memberId:'m-rawan',addedBy:'m-rawan',at:'2026-11-25T13:40:00Z',status:'pending'});
  Logger.log('تم. رابط الجدول: ' + ss_().getUrl());
}
