import { useEffect, useState } from 'react';
import { useBackClose } from './useBackClose';
import { isValidEmail, isValidPhone, normalizeDigits, normalizePhone } from '../lib/validation';

export interface EditableRegistration {
  id: number;
  student_name: string;
  national_id?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  training_type?: string | null;
  education?: string | null;
  workplace?: string | null;
  job_title?: string | null;
  course_title: string;
}

type Patch = Partial<Omit<EditableRegistration, 'id'>>;

interface Props {
  row: EditableRegistration | null;
  courseTitles: string[];
  onSave: (id: number, patch: Patch) => Promise<boolean>;
  onClose: () => void;
}

const field: React.CSSProperties = { width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' };
const label: React.CSSProperties = { fontSize: 12, fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: 3 };

/** نافذة تعديل بيانات متدرب (كل الحقول بما فيها الكورس) */
export default function EditRegistrationModal({ row, courseTitles, onSave, onClose }: Props) {
  const [f, setF] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  useBackClose(!!row, () => { if (!saving) onClose(); });

  useEffect(() => {
    if (!row) return;
    setErrors({});
    setF({
      student_name: row.student_name ?? '', national_id: row.national_id ?? '', phone: row.phone ?? '', email: row.email ?? '',
      address: row.address ?? '', training_type: row.training_type ?? '', education: row.education ?? '',
      workplace: row.workplace ?? '', job_title: row.job_title ?? '', course_title: row.course_title ?? '',
    });
  }, [row]);

  if (!row) return null;
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const inList = courseTitles.some((t) => t.trim() === (f.course_title || '').trim());

  const save = async () => {
    const e: Record<string, string> = {};
    if (f.student_name.trim().length < 3) e.student_name = 'الاسم مطلوب (3 أحرف على الأقل)';
    const nid = normalizeDigits(f.national_id || '');
    if (nid && nid.length !== 14) e.national_id = 'الرقم القومي 14 رقماً (أو اتركه فارغاً)';
    const phone = normalizePhone(f.phone || '');
    if (phone && !isValidPhone(phone)) e.phone = 'رقم الهاتف غير صحيح';
    if (f.email.trim() && !isValidEmail(f.email)) e.email = 'البريد الإلكتروني غير صحيح';
    if (!f.course_title.trim()) e.course_title = 'اختر الكورس';
    setErrors(e);
    if (Object.keys(e).length) return;
    const nz = (v: string) => (v.trim() === '' ? null : v.trim());
    setSaving(true);
    const ok = await onSave(row.id, {
      student_name: f.student_name.trim(), national_id: nid || null, phone: phone || null, email: nz(f.email), address: nz(f.address),
      training_type: nz(f.training_type), education: nz(f.education), workplace: nz(f.workplace), job_title: nz(f.job_title), course_title: f.course_title.trim(),
    });
    setSaving(false);
    if (ok) onClose();
  };

  const input = (k: string, title: string, extra?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label style={label}>{title}</label>
      <input value={f[k] ?? ''} onChange={(ev) => set(k, ev.target.value)} style={{ ...field, borderColor: errors[k] ? '#dc2626' : '#cbd5e1' }} {...extra} />
      {errors[k] && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 2 }}>{errors[k]}</div>}
    </div>
  );

  return (
    <div onClick={() => { if (!saving) onClose(); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 15 }}>
      <div role="dialog" aria-modal="true" aria-label="تعديل بيانات المتدرب" onClick={(ev) => ev.stopPropagation()}
        style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 460, maxHeight: '92vh', overflowY: 'auto', padding: 20, direction: 'rtl', textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 style={{ margin: 0, color: '#2d3d52' }}>✏️ تعديل بيانات المتدرب</h3>
        {input('student_name', 'الاسم *')}
        <div>
          <label style={label}>الكورس *</label>
          <select value={f.course_title ?? ''} onChange={(ev) => set('course_title', ev.target.value)} style={{ ...field, background: '#fff' }}>
            {!inList && <option value={f.course_title}>{f.course_title} (غير مسجل في التطبيق)</option>}
            {courseTitles.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {errors.course_title && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 2 }}>{errors.course_title}</div>}
        </div>
        {input('national_id', 'الرقم القومي', { inputMode: 'numeric', dir: 'ltr' })}
        {input('phone', 'رقم الواتساب', { type: 'tel', dir: 'ltr' })}
        {input('email', 'البريد الإلكتروني', { type: 'email', dir: 'ltr' })}
        {input('address', 'العنوان')}
        <div>
          <label style={label}>نوع التدريب</label>
          <select value={f.training_type ?? ''} onChange={(ev) => set('training_type', ev.target.value)} style={{ ...field, background: '#fff' }}>
            <option value="">غير محدد</option>
            <option value="أونلاين">أونلاين</option>
            <option value="أوفلاين">أوفلاين</option>
            {f.training_type && !['أونلاين', 'أوفلاين', ''].includes(f.training_type) && <option value={f.training_type}>{f.training_type}</option>}
          </select>
        </div>
        {input('education', 'المؤهل الدراسي')}
        {input('workplace', 'جهة العمل')}
        {input('job_title', 'الوظيفة')}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button onClick={save} disabled={saving} style={{ flex: 1, background: '#8b44db', color: '#fff', border: 'none', padding: 11, borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'جاري الحفظ...' : '💾 حفظ التعديلات'}</button>
          <button onClick={onClose} disabled={saving} style={{ background: '#e2e8f0', border: 'none', padding: '11px 18px', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}
