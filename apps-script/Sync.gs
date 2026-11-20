// مزامنة الصفوف المكتوبة يدوياً في الشيت إلى التطبيق
// ضعه كملف جديد داخل نفس مشروع Apps Script (بجانب Code.gs) — لا يغيّر شيئاً مما سبق.
// يعتمد على: SUPABASE_URL و SUPABASE_KEY و HEADERS و STATUSES و getSheet_ و clean_ من Code.gs.

var IMPORT_SECRET = '';   // نفس الكلمة التي وضعتها في Supabase (حروف إنجليزية وأرقام فقط)

// يرسل كل صف جديد (عمود «المعرّف» فارغ) إلى التطبيق، ثم يكتب له معرّفاً حتى لا يُرسل مرة ثانية
function syncNewRowsToApp() { return syncRows_(true); }

function syncRows_(interactive) {
  var lock = LockService.getScriptLock();
  var res = { sent: 0, duplicate: 0, skipped: [], failed: 0 };
  try {
    lock.waitLock(25000);
    if (!SUPABASE_URL || !SUPABASE_KEY || !IMPORT_SECRET) {
      throw new Error('اضبط SUPABASE_URL و SUPABASE_KEY (في Code.gs) و IMPORT_SECRET (في Sync.gs).');
    }
    var sheet = getSheet_();
    var last = sheet.getLastRow();
    if (last > 1) {
      var values = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
      for (var i = 0; i < values.length; i++) {
        var r = values[i];
        if (String(r[13] || '').trim()) continue;                       // أُرسل سابقاً (أو جاء من التطبيق/النموذج)
        var name = clean_(r[1]), nid = String(r[2] == null ? '' : r[2]).replace(/\D/g, '');
        var phone = String(r[3] == null ? '' : r[3]).replace(/[^\d+]/g, ''), course = clean_(r[10]);
        if (!name && !nid && !phone && !course) continue;               // صف فارغ
        var rowNo = i + 2, missing = [];
        if (!name) missing.push('الاسم');
        if (!course) missing.push('الكورس');
        if (missing.length) { res.skipped.push('صف ' + rowNo + ': ينقصه ' + missing.join('، ')); continue; }
        if (/^1[0125]\d{8}$/.test(phone)) phone = '0' + phone;          // الشيت يحذف الصفر الأول من الأرقام
        var status = STATUSES.indexOf(String(r[11])) >= 0 ? String(r[11]) : 'جديد';
        var cid = 'sheet-' + Utilities.getUuid();
        var created = r[0] instanceof Date ? r[0].toISOString() : '';
        var resp = UrlFetchApp.fetch(SUPABASE_URL + '/rest/v1/rpc/import_sheet_registration', {
          method: 'post', contentType: 'application/json', muteHttpExceptions: true,
          headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, 'Content-Profile': 'mharaty' },
          payload: JSON.stringify({ p_secret: IMPORT_SECRET, p: {
            course_title: course, student_name: name, national_id: nid, phone: phone, email: clean_(r[4]), address: clean_(r[5]),
            training_type: clean_(r[6]), education: clean_(r[7]), workplace: clean_(r[8]), job_title: clean_(r[9]),
            status: status, notes: clean_(r[12]), client_id: cid, created_at: created } })
        });
        var code = resp.getResponseCode(), body = resp.getContentText();
        if (code >= 300) {
          res.failed++;
          console.error('sync row ' + rowNo + ': ' + code + ' ' + body);
          if (body.indexOf('unauthorized') >= 0) throw new Error('كلمة السر IMPORT_SECRET لا تطابق ما في Supabase.');
          continue;
        }
        if (body.indexOf('duplicate') >= 0) res.duplicate++; else res.sent++;
        sheet.getRange(rowNo, 14).setValue(cid);                       // معرّف الصف (ليتزامن تغيير الحالة لاحقاً)
        if (!r[11]) sheet.getRange(rowNo, 12).setValue(status);
        if (phone !== String(r[3])) sheet.getRange(rowNo, 4).setNumberFormat('@').setValue(phone);
      }
    }
  } catch (err) {
    res.error = String(err && err.message || err);
    console.error('syncRows_: ' + res.error);
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
  if (interactive) {
    var msg = res.error ? ('تعذرت المزامنة: ' + res.error)
      : ('تم إرسال ' + res.sent + ' صف إلى التطبيق' + (res.duplicate ? ('، و' + res.duplicate + ' مسجل مسبقاً (تم تخطيه)') : '') +
         (res.failed ? ('، وفشل ' + res.failed) : '') + (res.skipped.length ? ('.\nلم يُرسل:\n' + res.skipped.join('\n')) : '.'));
    try { SpreadsheetApp.getUi().alert(msg); } catch (e) { Logger.log(msg); }
  }
  return res;
}

// مزامنة تلقائية كل 5 دقائق (تشغّلها مرة واحدة من القائمة)
function autoSyncTick_() { syncRows_(false); }

function enableAutoSync() {
  disableAutoSync(true);
  ScriptApp.newTrigger('autoSyncTick_').timeBased().everyMinutes(5).create();
  try { SpreadsheetApp.getUi().alert('تم تفعيل المزامنة التلقائية: الصفوف الجديدة تصل للتطبيق خلال 5 دقائق.'); } catch (e) {}
}

function disableAutoSync(silent) {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'autoSyncTick_') ScriptApp.deleteTrigger(t);
  });
  if (silent !== true) { try { SpreadsheetApp.getUi().alert('تم إيقاف المزامنة التلقائية.'); } catch (e) {} }
}
