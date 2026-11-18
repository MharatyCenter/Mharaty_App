// تحويل الأرقام العربية/الفارسية إلى لاتينية
const toLatinDigits = (s: string) =>
  s
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));

/** يحوّل الأرقام العربية إلى لاتينية ويحذف أي رموز غير رقمية */
export function normalizeDigits(raw: string): string {
  return toLatinDigits(raw).replace(/\D/g, '');
}

/** الرقم القومي المصري: 14 رقماً، أول رقم 2 أو 3، تاريخ ميلاد صحيح، كود محافظة صحيح */
export function isValidNationalId(raw: string): boolean {
  const id = normalizeDigits(raw);
  if (!/^[23]\d{13}$/.test(id)) return false;
  const year = (id[0] === '2' ? 1900 : 2000) + Number(id.slice(1, 3));
  const month = Number(id.slice(3, 5));
  const day = Number(id.slice(5, 7));
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day || d > new Date()) return false;
  const gov = Number(id.slice(7, 9));
  return (gov >= 1 && gov <= 35) || gov === 88;
}

/** ينظّف رقم الهاتف: أرقام لاتينية فقط مع إبقاء + في البداية */
export function normalizePhone(raw: string): string {
  const s = toLatinDigits(raw).replace(/[\s\-().]/g, '');
  return s.startsWith('+') ? '+' + s.slice(1).replace(/\D/g, '') : s.replace(/\D/g, '');
}

/** يقبل الأرقام المصرية (01xxxxxxxxx) والأرقام الدولية (+ثم 8–15 رقماً) */
export function isValidPhone(raw: string): boolean {
  const p = normalizePhone(raw);
  return /^01[0125]\d{8}$/.test(p) || /^\+\d{8,15}$/.test(p);
}

export function isValidEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw.trim());
}

export function isValidName(raw: string): boolean {
  return raw.trim().length >= 3;
}

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** يحوّل رقم الهاتف إلى الصيغة الدولية المطلوبة لروابط واتساب (بدون + أو أصفار بادئة) */
export function toWhatsAppNumber(raw: string): string {
  let p = normalizePhone(raw);
  if (p.startsWith('+')) return p.slice(1);
  if (p.startsWith('00')) return p.slice(2);
  if (/^01[0125]\d{8}$/.test(p)) return '20' + p.slice(1); // رقم مصري محلي
  if (/^1[0125]\d{8}$/.test(p)) return '20' + p;
  return p;
}
