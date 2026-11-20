import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { STATUS_META } from '../lib/messages';
import type { RegStatus } from '../lib/messages';

interface Result { course_title: string; status: RegStatus; created_at: string }
const field: React.CSSProperties = { padding: '10px 12px', borderRadius: 10, border: '1px solid var(--mh-border)', fontSize: 14, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', background: '#fff' };

/** استعلام المتابع عن كورساته بالهاتف + الاسم (دالة آمنة لا تكشف إلا اسم الكورس وحالته) */
export default function MyCourses() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Result[] | null>(null);
  const [err, setErr] = useState('');

  const search = async () => {
    setErr(''); setRes(null);
    if (name.trim().split(/\s+/).filter((w) => w.length >= 2).length < 2) { setErr('اكتب اسمك الأول والأخير على الأقل.'); return; }
    setBusy(true);
    const { data, error } = await supabase.schema('mharaty').rpc('my_courses', { p_name: name });
    setBusy(false);
    if (error) { setErr('تعذر الاستعلام الآن، حاول لاحقاً.'); return; }
    setRes((data || []) as Result[]);
  };

  const groups: [string, string, Result[]][] = res ? [
    ['🎓 كورسات أتممتها', '#0e7490', res.filter((r) => r.status === 'completed')],
    ['✅ كورسات مسددة', '#047857', res.filter((r) => r.status === 'paid')],
    ['⏳ قيد التسجيل', '#b45309', res.filter((r) => ['new', 'contacted', 'awaiting_payment'].includes(r.status))],
  ] : [];

  return (
    <section style={{ background: '#fff', border: '1px solid var(--mh-border)', borderRadius: 12, padding: 14, marginBottom: 24 }}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        style={{ width: '100%', background: 'none', border: 'none', textAlign: 'right', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 16, color: 'var(--mh-navy)', display: 'flex', justifyContent: 'space-between' }}>
        <span>🔎 استعلم عن كورساتك</span><span>{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--mh-muted)' }}>اكتب اسمك (الأول والأخير على الأقل) كما سجلته لتعرف كورساتك.</div>
          <input aria-label="الاسم" placeholder="اسمك الكامل أو الأول والأخير" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void search(); }} style={field} />
          <button type="button" onClick={search} disabled={busy} style={{ padding: '10px', borderRadius: 10, border: 'none', background: '#2d3d52', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}>{busy ? 'جاري البحث...' : 'بحث'}</button>
          {err && <div role="alert" style={{ color: '#b91c1c', fontSize: 13 }}>{err}</div>}
          {res && res.length === 0 && <div style={{ fontSize: 13, color: '#475569', background: '#f8fafc', padding: 10, borderRadius: 8 }}>لا توجد نتائج. تأكد أن الاسم مطابق لما سجلت به، أو تواصل مع المركز.</div>}
          {res && res.length > 0 && groups.filter(([, , l]) => l.length).map(([title, color, list]) => (
            <div key={title}>
              <div style={{ fontWeight: 700, color, fontSize: 14, margin: '6px 0 4px' }}>{title}</div>
              {list.map((r, i) => (
                <div key={i} style={{ padding: '8px 10px', border: '1px solid var(--mh-border)', borderRight: `4px solid ${color}`, borderRadius: 8, marginBottom: 4, fontSize: 14 }}>
                  {r.course_title} <span style={{ fontSize: 11, color: 'var(--mh-muted)' }}>· {STATUS_META[r.status]?.label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
