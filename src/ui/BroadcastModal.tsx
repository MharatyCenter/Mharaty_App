import { useMemo, useState } from 'react';
import { useBackClose } from './useBackClose';
import { toWhatsAppNumber } from '../lib/validation';
import { STATUS_META, STATUS_ORDER } from '../lib/messages';
import type { RegStatus } from '../lib/messages';

interface Row { student_name: string; phone?: string | null; course_title: string; status: RegStatus }
interface Person { key: string; name: string; number: string; courses: string[] }

const DEFAULT_TEXT = 'مرحباً {name} 👋\nيسعدنا إخبارك بـ ...\n(اكتب هنا الخبر أو العرض)\nمركز مهاراتي للتدريب';
const field: React.CSSProperties = { padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, width: '100%', fontFamily: 'inherit', background: '#fff' };
const btn = (bg: string): React.CSSProperties => ({ background: bg, color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 });

/** رسالة جماعية: اختيار المستلمين ثم إرسال واتساب لكل واحد بنقرة (واتساب لا يسمح بالإرسال الآلي دفعة واحدة) */
export default function BroadcastModal({ open, rows, courseTitles, onClose }: { open: boolean; rows: Row[]; courseTitles: string[]; onClose: () => void }) {
  useBackClose(open, onClose);
  const [course, setCourse] = useState('all');
  const [statuses, setStatuses] = useState<RegStatus[]>(STATUS_ORDER.filter((s) => s !== 'cancelled'));
  const [text, setText] = useState(DEFAULT_TEXT);
  const [step, setStep] = useState<1 | 2>(1);
  const [unchecked, setUnchecked] = useState<Set<string>>(new Set());
  const [sent, setSent] = useState<Set<string>>(new Set());

  const { people, noPhone } = useMemo(() => {
    const map = new Map<string, Person>(); let none = 0;
    rows.forEach((r) => {
      if (course !== 'all' && r.course_title !== course) return;
      if (!statuses.includes(r.status)) return;
      const number = toWhatsAppNumber(r.phone ?? '');
      if (!number) { none++; return; }
      const p = map.get(number);
      if (p) { if (!p.courses.includes(r.course_title)) p.courses.push(r.course_title); }
      else map.set(number, { key: number, name: r.student_name, number, courses: [r.course_title] });
    });
    return { people: [...map.values()], noPhone: none };
  }, [rows, course, statuses]);

  if (!open) return null;
  const chosen = people.filter((p) => !unchecked.has(p.key));
  const toggleStatus = (s: RegStatus) => setStatuses((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  const toggleOne = (k: string) => setUnchecked((p) => { const n = new Set(p); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const personText = (p: Person) => text.split('{name}').join(p.name.trim().split(/\s+/)[0] || p.name);
  const url = (p: Person) => `https://wa.me/${p.number}?text=${encodeURIComponent(personText(p))}`;
  const send = (p: Person) => { window.open(url(p), '_blank', 'noopener'); setSent((s) => new Set(s).add(p.key)); };
  const next = chosen.find((p) => !sent.has(p.key));

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 15 }}>
      <div role="dialog" aria-modal="true" aria-label="رسالة جماعية" onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto', padding: 20, direction: 'rtl', textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 style={{ margin: 0, color: '#2d3d52' }}>📣 رسالة جماعية للمتدربين</h3>

        {step === 1 ? (
          <>
            <label style={{ fontSize: 12, color: '#64748b' }}>المستلمون من كورس</label>
            <select value={course} onChange={(e) => { setCourse(e.target.value); setUnchecked(new Set()); }} style={field}>
              <option value="all">كل الكورسات</option>
              {courseTitles.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <div style={{ fontSize: 12, color: '#64748b' }}>الحالات المشمولة:</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {STATUS_ORDER.map((s) => (
                <label key={s} style={{ fontSize: 12, background: STATUS_META[s].bg, color: STATUS_META[s].color, padding: '4px 8px', borderRadius: 12, cursor: 'pointer', opacity: statuses.includes(s) ? 1 : 0.45 }}>
                  <input type="checkbox" checked={statuses.includes(s)} onChange={() => toggleStatus(s)} style={{ marginLeft: 4 }} />{STATUS_META[s].label}
                </label>
              ))}
            </div>
            <label style={{ fontSize: 12, color: '#64748b' }}>نص الرسالة — <code>{'{name}'}</code> يُستبدل باسم كل متدرب</label>
            <textarea aria-label="نص الرسالة" rows={6} value={text} onChange={(e) => setText(e.target.value)} style={{ ...field, resize: 'vertical' }} />
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: 10, fontSize: 13 }}>
              <b>{people.length}</b> مستلم (بدون تكرار للأرقام){noPhone > 0 ? ` — تم تخطي ${noPhone} بلا رقم صالح` : ''}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" disabled={people.length === 0 || !text.trim()} onClick={() => setStep(2)} style={{ ...btn('#25d366'), opacity: people.length === 0 || !text.trim() ? 0.5 : 1 }}>التالي: مراجعة المستلمين</button>
              <button type="button" onClick={onClose} style={btn('#94a3b8')}>إغلاق</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 13, color: '#475569' }}>اضغط «إرسال» بجانب كل اسم لفتح واتساب بالرسالة جاهزة، ثم اضغط إرسال داخل واتساب. أُرسل: <b>{chosen.filter((p) => sent.has(p.key)).length}</b> من <b>{chosen.length}</b></div>
            {next && <button type="button" onClick={() => send(next)} style={btn('#25d366')}>▶ إرسال التالي: {next.name}</button>}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, maxHeight: '45vh', overflowY: 'auto' }}>
              {people.map((p) => (
                <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderBottom: '1px solid #f1f5f9', opacity: sent.has(p.key) ? 0.55 : 1 }}>
                  <input type="checkbox" aria-label={`اختيار ${p.name}`} checked={!unchecked.has(p.key)} onChange={() => toggleOne(p.key)} />
                  <div style={{ flex: 1, minWidth: 0, fontSize: 13 }}>
                    <div style={{ fontWeight: 600 }}>{p.name} {sent.has(p.key) ? '✅' : ''}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }} dir="ltr">{p.number} · {p.courses.join('، ')}</div>
                  </div>
                  <button type="button" disabled={unchecked.has(p.key)} onClick={() => send(p)} style={{ ...btn(sent.has(p.key) ? '#64748b' : '#25d366'), padding: '5px 10px', opacity: unchecked.has(p.key) ? 0.4 : 1 }}>{sent.has(p.key) ? 'إعادة' : 'إرسال'}</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setStep(1)} style={btn('#64748b')}>رجوع لتعديل الرسالة</button>
              <button type="button" onClick={onClose} style={btn('#94a3b8')}>إغلاق</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
