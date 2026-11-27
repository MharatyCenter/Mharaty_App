/**
 * مهاراتي - استقبال تسجيلات المتدربين في Google Sheet
 * ----------------------------------------------------
 * 1) افتح ملف Google Sheet جديد  ->  الإضافات (Extensions)  ->  Apps Script
 * 2) الصق هذا الكود بالكامل مكان الكود الموجود، وغيّر SECRET و NOTIFY_EMAIL
 * 3) Deploy -> New deployment -> Web app
 *      Execute as: Me
 *      Who has access: Anyone
 * 4) انسخ رابط الـ Web app وضعه في ملف .env  (VITE_SHEETS_WEBHOOK_URL)
 */

var SECRET = 'mh2026abc';                 // استخدم حروفاً إنجليزية وأرقاماً فقط، وتطابق VITE_SHEETS_SECRET في .env
var NOTIFY_EMAIL = '';                    // بريد لإشعار كل تسجيل جديد (اتركه فارغاً لإيقاف الإشعارات)
var SUPABASE_URL = '';                    // مثل https://xxxx.supabase.co  (لنموذج جوجل: لجلب الكورسات وإرسال التسجيلات للتطبيق)
var SUPABASE_KEY = '';                    // مفتاح anon العام (نفس VITE_SUPABASE_ANON_KEY في .env)
var SHEET_NAME = 'التسجيلات';
var STATUSES = ['جديد', 'تم التواصل', 'بانتظار السداد', 'تم السداد', 'مكتمل', 'ملغي'];
var HEADERS = ['التاريخ', 'الاسم', 'الرقم القومي', 'واتساب', 'البريد الإلكتروني', 'العنوان', 'نوع التدريب', 'المؤهل', 'جهة العمل', 'الوظيفة', 'الكورس', 'الحالة', 'ملاحظات', 'المعرّف'];
// ترتيب الأعمدة (يبدأ من 0): 0 تاريخ، 1 اسم، 2 رقم قومي، 3 واتساب، 4 بريد، 5 عنوان، 6 نوع التدريب، 7 مؤهل، 8 جهة عمل، 9 وظيفة، 10 كورس، 11 حالة، 12 ملاحظات، 13 معرّف

function doPost(e) {
  var lock = null;
  try {
    var data = JSON.parse(e.postData.contents);

    if (String(data.secret || '').trim() !== String(SECRET).trim()) {
      return json_({ ok: false, error: 'unauthorized', v: 'v8', expectedLen: String(SECRET).trim().length, receivedLen: String(data.secret || '').trim().length });
    }

    // زر «من الشيت إلى التطبيق» في لوحة المتدربين: ينقل الصفوف المكتوبة يدوياً (له قفله الخاص، فلا نأخذ قفلاً هنا)
    if (data.action === 'sync_to_app') {
      if (typeof syncRows_ !== 'function') return json_({ ok: false, error: 'Sync.gs غير مضاف' });
      var r = syncRows_(false, true);
      return json_({ ok: !r.error, sent: r.sent, duplicate: r.duplicate, skipped: r.skipped.length, failed: r.failed, statusUpdated: r.statusUpdated, error: r.error || '' });
    }

    lock = LockService.getScriptLock();
    lock.waitLock(20000);

    // تحديث حالة متدرب موجود (يُرسل من لوحة الإدارة عند تغيير الحالة)
    if (data.action === 'update_status') return json_(updateStatus_(data));

    // نقل دفعة متدربين من التطبيق إلى الشيت (حتى 50 في الطلب الواحد)
    if (data.action === 'backfill_batch') {
      var out = { ok: true, added: 0, duplicate: 0, failed: 0 };
      (data.rows || []).slice(0, 50).forEach(function (row) {
        row.action = 'backfill';
        var x = saveRegistration_(row);
        if (x.ok && x.duplicate) out.duplicate++; else if (x.ok) out.added++; else out.failed++;
      });
      return json_(out);
    }

    // زر «من التطبيق إلى الشيت»: يضيف متدرباً غير موجود في الشيت بحالته وملاحظاته وتاريخه الأصلي
    return json_(saveRegistration_(data));
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { if (lock) lock.releaseLock(); } catch (x) {}
  }
}

function saveRegistration_(data) {
  var name = clean_(data.student_name), phone = clean_(data.phone), course = clean_(data.course_title);
  var nid = clean_(data.national_id);
  var backfill = data.action === 'backfill';   // نقل من التطبيق: نحفظ الحالة والملاحظات والتاريخ الأصلي
  // التسجيل الجديد يلزمه الهاتف والرقم القومي، أما النقل من التطبيق (سجلات قديمة) فيكفيه الاسم والكورس
  if (!name || !course || (!backfill && (!phone || !nid))) return { ok: false, error: 'missing fields' };

  var sheet = getSheet_();

  // منع التكرار: نفس المعرّف (إعادة إرسال) أو نفس الرقم القومي + نفس الكورس
  var last = sheet.getLastRow();
  if (last > 1) {
    var rows = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
    for (var i = 0; i < rows.length; i++) {
      var sameStudent = nid
        ? String(rows[i][2]).replace(/\D/g, '') === nid.replace(/\D/g, '') && clean_(rows[i][10]) === course
        : clean_(rows[i][1]) === name && clean_(rows[i][10]) === course;   // بلا رقم قومي: نقارن بالاسم + الكورس
      if (rows[i][13] === data.id || sameStudent) {
        // صف كُتب يدوياً بلا معرّف: نربطه بمعرّف التطبيق ليتزامن تغيير الحالة لاحقاً
        if (!String(rows[i][13] || '').trim() && data.id) sheet.getRange(i + 2, 14).setValue(clean_(data.id));
        return { ok: true, duplicate: true };
      }
    }
  }

  var created = backfill && data.created_at ? new Date(data.created_at) : new Date();
  if (isNaN(created.getTime())) created = new Date();
  sheet.appendRow([
    created, name, nid, phone, clean_(data.email), clean_(data.address), clean_(data.training_type),
    clean_(data.education), clean_(data.workplace), clean_(data.job_title), course,
    backfill && STATUSES.indexOf(data.status) >= 0 ? data.status : 'جديد', backfill ? clean_(data.notes) : '', clean_(data.id)
  ]);

  if (NOTIFY_EMAIL && !backfill) {
    MailApp.sendEmail(NOTIFY_EMAIL, 'تسجيل جديد: ' + course,
      'الاسم: ' + name + '\nواتساب: ' + phone + '\nنوع التدريب: ' + clean_(data.training_type) + '\nالكورس: ' + course);
  }
return { ok: true };
}

// لاختبار الرابط من المتصفح
function doGet() {
  return json_({ ok: true, service: 'mharaty-registrations', v: 'v6' });
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  // لو كان التبويب قديماً (بأعمدة مختلفة) نحتفظ به باسم جديد وننشئ تبويباً جديداً
  if (sheet && (sheet.getLastColumn() !== HEADERS.length || sheet.getRange(1, 3).getValue() !== HEADERS[2])) {
    sheet.setName(SHEET_NAME + ' (قديم ' + Utilities.formatDate(new Date(), 'Africa/Cairo', 'yyyy-MM-dd HHmm') + ')');
    sheet = null;
  }
  if (sheet) {
    // تحديث القائمة المنسدلة للحالة (لو كانت الشيت أُنشئت بقائمة قديمة)
    sheet.getRange('L2:L1000').setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).build());
    return sheet;
  }

  sheet = ss.insertSheet(SHEET_NAME, 0);
  sheet.setRightToLeft(true);
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
    .setFontWeight('bold').setBackground('#2d3d52').setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  sheet.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm');
  sheet.getRange('C:D').setNumberFormat('@'); // الرقم القومي والهاتف كنص حتى لا تضيع الأصفار أو تتحول لأرقام علمية
  sheet.getRange('L2:L1000').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).build());
  sheet.setColumnWidths(1, HEADERS.length, 140);
  sheet.setColumnWidth(6, 260);
  sheet.hideColumns(14); // عمود المعرّف داخلي
  return sheet;
}

function updateStatus_(data) {
  var id = clean_(data.id), status = clean_(data.status);
  if (!id || STATUSES.indexOf(status) === -1) return { ok: false, error: 'bad request' };
  var sheet = getSheet_();
  var last = sheet.getLastRow();
  if (last < 2) return { ok: false, error: 'not found' };
  var ids = sheet.getRange(2, 14, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === id) {
      sheet.getRange(i + 2, 12).setValue(status);
      return { ok: true, updated: true };
    }
  }
  return { ok: false, error: 'not found' };
}

function clean_(v) { return String(v == null ? '' : v).trim().slice(0, 300); }
function normPhone_(v) { return String(v).replace(/[^\d+]/g, ''); }
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}


/* ======================================================================
 * نموذج جوجل للتسجيل (اختياري)
 * من قائمة الشيت: مهاراتي -> إنشاء نموذج التسجيل
 * يتطلب ضبط SUPABASE_URL و SUPABASE_KEY في أول الملف
 * ====================================================================== */

var Q = {
  course: 'الكورس المطلوب',
  name: 'الاسم الكامل (كما في البطاقة)',
  nid: 'الرقم القومي',
  phone: 'رقم الواتساب',
  email: 'البريد الإلكتروني (اختياري)',
  address: 'العنوان',
  type: 'نوع التدريب',
  edu: 'المؤهل الدراسي',
  work: 'جهة العمل (اختياري)',
  job: 'الوظيفة (اختياري)'
};

function onOpen() {
  try {
    SpreadsheetApp.getUi().createMenu('مهاراتي')
      .addItem('إنشاء نموذج التسجيل', 'createRegistrationForm')
      .addItem('تحديث قائمة الكورسات في النموذج', 'syncCourseChoices')
      .addItem('عرض رابط النموذج', 'showFormLinks')
      .addItem('إعادة إنشاء النموذج (بعد حذف القديم)', 'recreateRegistrationForm')
      .addSeparator()
      .addItem('إرسال الصفوف الجديدة إلى التطبيق الآن', 'syncNewRowsToApp')
      .addItem('تفعيل مزامنة تغيير الحالة مع التطبيق', 'installStatusTrigger')
      .addItem('تفعيل المزامنة التلقائية (كل 5 دقائق)', 'enableAutoSync')
      .addItem('إيقاف المزامنة التلقائية', 'disableAutoSync')
      .addToUi();
  } catch (e) {}
}

function createRegistrationForm() {
  var props = PropertiesService.getScriptProperties();
  var existingId = props.getProperty('FORM_ID');
  if (existingId) {
    var alive = false;
    try {
      FormApp.openById(existingId);
      alive = !DriveApp.getFileById(existingId).isTrashed(); // النموذج المحذوف يبقى في سلة المهملات ويمكن فتحه، فنتحقق منها
    } catch (e) { alive = false; }
    if (alive) { showFormLinks(); return; }
    resetFormState_(); // النموذج القديم محذوف: ننظف ثم ننشئ واحداً جديداً
  }

  var courses = fetchCourseTitles_();
  if (!courses.length) throw new Error('لا توجد كورسات: تأكد من SUPABASE_URL و SUPABASE_KEY وأنك أضفت كورسات في التطبيق.');

  var form = FormApp.create('التسجيل في دورات مركز مهاراتي');
  form.setDescription('املأ البيانات التالية لتسجيل اسمك في الكورس، وسنتواصل معك عبر الواتساب لتأكيد الحجز.')
    .setConfirmationMessage('تم استلام تسجيلك بنجاح ✅ سنتواصل معك قريباً عبر الواتساب.')
    .setAllowResponseEdits(false)
    .setShowLinkToRespondAgain(true);

  form.addListItem().setTitle(Q.course).setChoiceValues(courses).setRequired(true);

  form.addTextItem().setTitle(Q.name).setRequired(true)
    .setValidation(FormApp.createTextValidation().setHelpText('اكتب الاسم الكامل').requireTextLengthGreaterThanOrEqualTo(6).build());

  form.addTextItem().setTitle(Q.nid).setHelpText('14 رقماً بالأرقام الإنجليزية').setRequired(true)
    .setValidation(FormApp.createTextValidation().setHelpText('الرقم القومي يجب أن يكون 14 رقماً صحيحاً').requireTextMatchesPattern('[23][0-9]{13}').build());

  form.addTextItem().setTitle(Q.phone).setHelpText('مثال: 01012345678').setRequired(true)
    .setValidation(FormApp.createTextValidation().setHelpText('اكتب رقماً صحيحاً مثل 01012345678').requireTextMatchesPattern('(\\+[0-9]{8,15}|01[0125][0-9]{8})').build());

  form.addTextItem().setTitle(Q.email).setRequired(false)
    .setValidation(FormApp.createTextValidation().setHelpText('بريد إلكتروني غير صحيح').requireTextIsEmail().build());

  form.addParagraphTextItem().setTitle(Q.address).setHelpText('المحافظة - المدينة - الشارع').setRequired(true);

  form.addMultipleChoiceItem().setTitle(Q.type).setChoiceValues(['أونلاين', 'أوفلاين (حضوري)']).setRequired(true);

  form.addListItem().setTitle(Q.edu)
    .setChoiceValues(['مؤهل متوسط', 'دبلوم', 'بكالوريوس / ليسانس', 'دراسات عليا (ماجستير / دكتوراه)', 'أخرى']).setRequired(true);

  form.addTextItem().setTitle(Q.work).setHelpText('اتركه فارغاً إن لم تكن تعمل').setRequired(false);
  form.addTextItem().setTitle(Q.job).setRequired(false);

  form.setAcceptingResponses(true);
  props.setProperty('FORM_ID', form.getId());
  ScriptApp.newTrigger('onFormSubmit').forForm(form).onFormSubmit().create();
  showFormLinks();
}

/** يمسح بيانات النموذج القديم (المعرّف + المشغّلات القديمة) */
function resetFormState_() {
  PropertiesService.getScriptProperties().deleteProperty('FORM_ID');
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'onFormSubmit') ScriptApp.deleteTrigger(t);
  });
}

/** من القائمة: يتجاهل النموذج القديم وينشئ نموذجاً جديداً */
function recreateRegistrationForm() {
  resetFormState_();
  createRegistrationForm();
}

function showFormLinks() {
  var id = PropertiesService.getScriptProperties().getProperty('FORM_ID');
  if (!id) { notify_('لم يُنشأ نموذج بعد. اختر: مهاراتي ← إنشاء نموذج التسجيل'); return; }
  var form = FormApp.openById(id);
  if (!form.isAcceptingResponses()) form.setAcceptingResponses(true);
  notify_('رابط التسجيل (شاركه مع المتدربين):\n' + form.getPublishedUrl() + '\n\nرابط التعديل (لك فقط):\n' + form.getEditUrl());
}

function syncCourseChoices() {
  var id = PropertiesService.getScriptProperties().getProperty('FORM_ID');
  if (!id) { notify_('لم يُنشأ نموذج بعد.'); return; }
  var courses = fetchCourseTitles_();
  if (!courses.length) { notify_('لم أجد كورسات في التطبيق.'); return; }
  var form = FormApp.openById(id);
  var items = form.getItems(FormApp.ItemType.LIST);
  for (var i = 0; i < items.length; i++) {
    if (items[i].getTitle() === Q.course) { items[i].asListItem().setChoiceValues(courses); }
  }
  notify_('تم تحديث قائمة الكورسات (' + courses.length + ' كورس).');
}

// يعمل تلقائياً عند كل رد على النموذج
function onFormSubmit(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var map = {};
    e.response.getItemResponses().forEach(function (ir) { map[ir.getItem().getTitle()] = ir.getResponse(); });
    var data = {
      id: 'form-' + e.response.getId(),
      course_title: map[Q.course],
      student_name: map[Q.name],
      national_id: map[Q.nid],
      phone: map[Q.phone],
      email: map[Q.email] || '',
      address: map[Q.address],
      training_type: String(map[Q.type] || '').indexOf('أون') === 0 ? 'أونلاين' : 'أوفلاين',
      education: map[Q.edu],
      workplace: map[Q.work] || '',
      job_title: map[Q.job] || ''
    };
    var res = saveRegistration_(data);
    // لو كان مسجلاً مسبقاً (من التطبيق مثلاً) لا نكرره في قاعدة بيانات التطبيق
    if (res.ok && !res.duplicate) forwardToSupabase_(data);
  } catch (err) {
    console.error('onFormSubmit: ' + err);
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

function forwardToSupabase_(d) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  var resp = UrlFetchApp.fetch(SUPABASE_URL + '/rest/v1/course_registrations', {
    method: 'post',
    contentType: 'application/json',
    headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, 'Content-Profile': 'mharaty', Prefer: 'return=minimal' },
    payload: JSON.stringify({
      course_title: clean_(d.course_title), student_name: clean_(d.student_name), national_id: clean_(d.national_id),
      phone: clean_(d.phone), email: clean_(d.email), address: clean_(d.address), training_type: clean_(d.training_type),
      education: clean_(d.education), workplace: clean_(d.workplace), job_title: clean_(d.job_title), client_id: clean_(d.id)
    }),
    muteHttpExceptions: true
  });
  if (resp.getResponseCode() >= 300) console.error('Supabase insert failed: ' + resp.getResponseCode() + ' ' + resp.getContentText());
}

function fetchCourseTitles_() {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('اضبط SUPABASE_URL و SUPABASE_KEY في أول الملف.');
  var resp = UrlFetchApp.fetch(SUPABASE_URL + '/rest/v1/courses?select=title&order=id.desc', {
    headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, 'Accept-Profile': 'mharaty' },
    muteHttpExceptions: true
  });
  if (resp.getResponseCode() !== 200) throw new Error('تعذر جلب الكورسات: ' + resp.getResponseCode() + ' ' + resp.getContentText());
  var seen = {}, titles = [];
  JSON.parse(resp.getContentText()).forEach(function (c) {
    var t = clean_(c.title);
    if (t && !seen[t]) { seen[t] = true; titles.push(t); }
  });
  return titles;
}

function notify_(msg) {
  Logger.log(msg);
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) {}
}
