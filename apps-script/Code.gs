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
var SHEET_NAME = 'التسجيلات';
var STATUSES = ['جديد', 'تم التواصل', 'بانتظار السداد', 'تم السداد', 'مكتمل', 'ملغي'];
var HEADERS = ['التاريخ', 'الاسم', 'الرقم القومي', 'واتساب', 'البريد الإلكتروني', 'العنوان', 'نوع التدريب', 'المؤهل', 'جهة العمل', 'الوظيفة', 'الكورس', 'الحالة', 'ملاحظات', 'المعرّف'];
// ترتيب الأعمدة (يبدأ من 0): 0 تاريخ، 1 اسم، 2 رقم قومي، 3 واتساب، 4 بريد، 5 عنوان، 6 نوع التدريب، 7 مؤهل، 8 جهة عمل، 9 وظيفة، 10 كورس، 11 حالة، 12 ملاحظات، 13 معرّف

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var data = JSON.parse(e.postData.contents);

    if (String(data.secret || '').trim() !== String(SECRET).trim()) {
      return json_({ ok: false, error: 'unauthorized', v: 'v5', expectedLen: String(SECRET).trim().length, receivedLen: String(data.secret || '').trim().length });
    }

    // تحديث حالة متدرب موجود (يُرسل من لوحة الإدارة عند تغيير الحالة)
    if (data.action === 'update_status') return json_(updateStatus_(data));

    var name = clean_(data.student_name), phone = clean_(data.phone), course = clean_(data.course_title);
    var nid = clean_(data.national_id);
    if (!name || !phone || !course || !nid) return json_({ ok: false, error: 'missing fields' });

    var sheet = getSheet_();

    // منع التكرار: نفس المعرّف (إعادة إرسال) أو نفس الرقم القومي + نفس الكورس
    var last = sheet.getLastRow();
    if (last > 1) {
      var rows = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
      for (var i = 0; i < rows.length; i++) {
        var sameStudent = String(rows[i][2]) === nid && rows[i][10] === course;
        if (rows[i][13] === data.id || sameStudent) return json_({ ok: true, duplicate: true });
      }
    }

    sheet.appendRow([
      new Date(), name, nid, phone, clean_(data.email), clean_(data.address), clean_(data.training_type),
      clean_(data.education), clean_(data.workplace), clean_(data.job_title), course, 'جديد', '', clean_(data.id)
    ]);

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(NOTIFY_EMAIL, 'تسجيل جديد: ' + course,
        'الاسم: ' + name + '\nواتساب: ' + phone + '\nنوع التدريب: ' + clean_(data.training_type) + '\nالكورس: ' + course);
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

// لاختبار الرابط من المتصفح
function doGet() {
  return json_({ ok: true, service: 'mharaty-registrations', v: 'v5' });
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
