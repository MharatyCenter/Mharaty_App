// إرسال بيانات التسجيل إلى Google Sheet عبر Google Apps Script (Web App).
// الإعداد: انظر docs/GOOGLE_SHEETS_SETUP.md

export interface RegistrationPayload {
  id: string;
  course_title: string;
  student_name: string;
  national_id: string;
  phone: string; // واتساب
  email: string;
  address: string;
  training_type: string;
  education: string;
  workplace: string;
  job_title: string;
}

const WEBHOOK_URL = (import.meta.env.VITE_SHEETS_WEBHOOK_URL || '').trim();
const SECRET = (import.meta.env.VITE_SHEETS_SECRET || '').trim();

export const isSheetsEnabled = WEBHOOK_URL.length > 0;
export const sheetsViewUrl = (import.meta.env.VITE_SHEETS_VIEW_URL || '').trim();

/**
 * يرسل التسجيل إلى الشيت. نستخدم no-cors + text/plain لأن Apps Script لا يرد برؤوس CORS
 * على طلبات POST المعقدة؛ هذا يعني أننا لا نقرأ الرد، لكن الإرسال يتم بشكل موثوق.
 * يرجع true إذا خرج الطلب من الجهاز بنجاح (لا يوجد انقطاع شبكة).
 */
export async function sendRegistrationToSheet(payload: RegistrationPayload): Promise<boolean> {
  if (!isSheetsEnabled) {
    console.warn('[Sheets] الإرسال إلى Google Sheet معطّل: VITE_SHEETS_WEBHOOK_URL فارغ أو لم يُقرأ. تأكد من ملف .env وأعد تشغيل التطبيق.');
    return false;
  }
  try {
    console.info('[Sheets] جاري الإرسال إلى:', WEBHOOK_URL.slice(0, 60) + '...', '| السر معرّف:', SECRET.length > 0);
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ secret: SECRET, ...payload }),
    });
    console.info('[Sheets] تم إرسال الطلب. افحص صفحة التنفيذات (Executions) في Apps Script.');
    return true;
  } catch (err) {
    console.error('تعذر الإرسال إلى Google Sheet:', err);
    return false;
  }
}

/** مزامنة حالة المتدرب إلى الشيت (best-effort): يبحث السكربت عن الصف بالمعرّف ويحدّث عمود الحالة */
export async function sendStatusToSheet(clientId: string | null | undefined, statusLabel: string): Promise<boolean> {
  if (!isSheetsEnabled || !clientId) return false;
  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ secret: SECRET, action: 'update_status', id: clientId, status: statusLabel }),
    });
    return true;
  } catch (err) {
    console.error('تعذرت مزامنة الحالة مع Google Sheet:', err);
    return false;
  }
}
