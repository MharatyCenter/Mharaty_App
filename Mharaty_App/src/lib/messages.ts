// حالات التسجيل وقوالب رسائل الواتساب

export type RegStatus = 'new' | 'contacted' | 'awaiting_payment' | 'paid' | 'completed' | 'cancelled';
export type MessageKind = 'registered' | 'payment_request' | 'paid' | 'reminder' | 'completed' | 'cancelled';

export const STATUS_META: Record<RegStatus, { label: string; color: string; bg: string }> = {
  new: { label: 'جديد', color: '#1d4ed8', bg: '#dbeafe' },
  contacted: { label: 'تم التواصل', color: '#7e22ce', bg: '#f3e8ff' },
  awaiting_payment: { label: 'بانتظار السداد', color: '#b45309', bg: '#fef3c7' },
  paid: { label: 'تم السداد', color: '#047857', bg: '#d1fae5' },
  completed: { label: 'مكتمل', color: '#0e7490', bg: '#cffafe' },
  cancelled: { label: 'ملغي', color: '#475569', bg: '#e2e8f0' },
};
export const STATUS_ORDER: RegStatus[] = ['new', 'contacted', 'awaiting_payment', 'paid', 'completed', 'cancelled'];

export const MESSAGE_META: Record<MessageKind, {
  label: string; icon: string; sentField: string; nextStatus?: RegStatus; onlyFrom?: RegStatus[];
}> = {
  registered: { label: 'تأكيد التسجيل', icon: '✅', sentField: 'msg_registered_at', nextStatus: 'contacted', onlyFrom: ['new'] },
  payment_request: { label: 'طلب السداد', icon: '💳', sentField: 'msg_payment_request_at', nextStatus: 'awaiting_payment', onlyFrom: ['new', 'contacted'] },
  paid: { label: 'تأكيد السداد', icon: '🧾', sentField: 'msg_paid_at', nextStatus: 'paid' },
  reminder: { label: 'تذكير بالبدء', icon: '⏰', sentField: 'msg_reminder_at' },
  completed: { label: 'إتمام الكورس', icon: '🎓', sentField: 'msg_completed_at', nextStatus: 'completed', onlyFrom: ['paid', 'completed'] },
  cancelled: { label: 'إلغاء الاشتراك', icon: '❌', sentField: 'msg_cancelled_at', nextStatus: 'cancelled' },
};
export const MESSAGE_ORDER: MessageKind[] = ['registered', 'payment_request', 'paid', 'reminder', 'completed', 'cancelled'];

export const DEFAULT_TEMPLATES: Record<MessageKind, { title: string; body: string }> = {
  registered: {
    title: 'رسالة تأكيد التسجيل',
    body: 'مرحباً {name} 👋\nتم استلام تسجيلك في كورس «{course}» بنجاح ✅\nنوع التدريب: {training_type}\nسنوافيك بتفاصيل السداد وموعد البدء قريباً.\nمركز مهاراتي للتدريب',
  },
  payment_request: {
    title: 'رسالة طلب سداد الرسوم',
    body: 'مرحباً {name}،\nلتأكيد حجز مقعدك في كورس «{course}» برجاء سداد الرسوم: {fee} جنيه.\n\nطرق السداد:\n(اكتب هنا بيانات السداد: رقم المحفظة / الحساب البنكي)\n\nبعد السداد أرسل لنا صورة الإيصال على هذا الرقم.\nمركز مهاراتي للتدريب',
  },
  paid: {
    title: 'رسالة تأكيد السداد',
    body: 'مرحباً {name}،\nتم استلام رسوم كورس «{course}» ✅ وتأكد حجزك.\nموعد البدء: {start_date}\nالمواعيد: {schedule}\nنتشرف بوجودك 🌟\nمركز مهاراتي للتدريب',
  },
  reminder: {
    title: 'رسالة تذكير بموعد البدء',
    body: 'مرحباً {name} ⏰\nتذكير: يبدأ كورس «{course}» يوم {start_date}\nالمواعيد: {schedule}\nنوع التدريب: {training_type}\nفي انتظارك!\nمركز مهاراتي للتدريب',
  },
  completed: {
    title: 'رسالة إتمام الكورس',
    body: 'مرحباً {name} 🎓\nمبروك إتمامك كورس «{course}»!\nنشكرك على ثقتك بنا، وسنوافيك بتفاصيل استلام الشهادة قريباً.\nيسعدنا تقييمك للكورس ومشاركتنا رأيك.\nمركز مهاراتي للتدريب',
  },
  cancelled: {
    title: 'رسالة إلغاء الاشتراك',
    body: 'مرحباً {name}،\nنؤكد لك إلغاء اشتراكك في كورس «{course}» بناءً على طلبك.\nيسعدنا انضمامك لأي من كورساتنا القادمة في أي وقت، ونتمنى لك التوفيق.\nمركز مهاراتي للتدريب',
  },
};

export const PLACEHOLDERS = ['{name}', '{course}', '{fee}', '{start_date}', '{schedule}', '{training_type}'];
export const PAYMENT_PLACEHOLDER_MARK = 'اكتب هنا';

export interface MessageContext {
  name: string;
  course: string;
  fee?: number | null;
  startDate?: string | null; // YYYY-MM-DD
  schedule?: string | null;
  trainingType?: string | null;
}

export function formatArabicDate(iso?: string | null): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/** يملأ القالب بالبيانات. ما لم يُحدَّد من بيانات الكورس يُكتب كـ "سيتم الإعلان عنه" */
export function fillTemplate(body: string, ctx: MessageContext): string {
  const later = 'سيتم الإعلان عنه';
  const map: Record<string, string> = {
    '{name}': ctx.name,
    '{course}': ctx.course,
    '{fee}': ctx.fee != null && ctx.fee !== 0 ? String(ctx.fee) : later,
    '{start_date}': formatArabicDate(ctx.startDate) || later,
    '{schedule}': ctx.schedule?.trim() || later,
    '{training_type}': ctx.trainingType || 'غير محدد',
  };
  return Object.entries(map).reduce((text, [k, v]) => text.split(k).join(v), body);
}

export function daysUntil(iso?: string | null): number | null {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  const start = new Date(y, m - 1, d).getTime();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((start - today.getTime()) / 86400000);
}
