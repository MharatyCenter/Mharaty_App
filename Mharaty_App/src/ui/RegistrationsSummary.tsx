import { useMemo } from 'react';
import { STATUS_META } from '../lib/messages';
import type { RegStatus } from '../lib/messages';

interface Row { course_title: string; status: RegStatus; paid_amount?: number | null; created_at: string }

const norm = (t: string) => t.replace(/\s+/g, ' ').trim();
const DAY = 86400000;

function Card({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div style={{ flex: '1 1 140px', background: '#fff', border: '1px solid var(--mh-border)', borderRight: `4px solid ${color}`, borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ fontSize: 12, color: 'var(--mh-muted)' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--mh-navy)', lineHeight: 1.4 }}>{value}</div>
      {sub ? <div style={{ fontSize: 11, color: 'var(--mh-muted)' }}>{sub}</div> : null}
    </div>
  );
}

/** ملخص أرقام سريع للمتدربين: أعداد، مبالغ محصّلة، وتوزيع على الكورسات */
export default function RegistrationsSummary({ rows }: { rows: Row[] }) {
  const s = useMemo(() => {
    const now = Date.now();
    const active = rows.filter((r) => r.status !== 'cancelled');
    const week = active.filter((r) => now - new Date(r.created_at).getTime() < 7 * DAY).length;
    const today = active.filter((r) => new Date(r.created_at).toDateString() === new Date().toDateString()).length;
    const collected = rows.reduce((sum, r) => sum + (Number(r.paid_amount) || 0), 0);
    const awaiting = rows.filter((r) => r.status === 'new' || r.status === 'contacted' || r.status === 'awaiting_payment').length;
    const byCourse = new Map<string, { title: string; total: number; paid: number; cancelled: number }>();
    rows.forEach((r) => {
      const k = norm(r.course_title);
      const e = byCourse.get(k) || { title: k, total: 0, paid: 0, cancelled: 0 };
      if (r.status === 'cancelled') e.cancelled += 1; else e.total += 1;
      if (r.status === 'paid' || r.status === 'completed') e.paid += 1;
      byCourse.set(k, e);
    });
    const courses = Array.from(byCourse.values()).sort((a, b) => b.total - a.total).slice(0, 8);
    return { active: active.length, week, today, collected, awaiting, courses, max: Math.max(1, ...courses.map((c) => c.total)) };
  }, [rows]);

  if (rows.length === 0) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <Card label="المسجلون (دون الملغي)" value={s.active} sub={`اليوم: ${s.today} · آخر 7 أيام: ${s.week}`} color="#8b44db" />
        <Card label="يحتاجون متابعة" value={s.awaiting} sub="جديد / تم التواصل / بانتظار السداد" color="#f59e0b" />
        <Card label="المبالغ المحصّلة" value={`${s.collected.toLocaleString('ar-EG')} ج`} sub="مجموع «المبلغ المدفوع»" color="#10b981" />
      </div>
      <div style={{ background: '#fff', border: '1px solid var(--mh-border)', borderRadius: 10, padding: '10px 12px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--mh-navy)', marginBottom: 8 }}>التسجيل حسب الكورس</div>
        {s.courses.map((c) => (
          <div key={c.title} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 12 }}>
            <span style={{ flex: '0 0 38%', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.title}>{c.title}</span>
            <div style={{ flex: 1, height: 14, background: '#f1f5f9', borderRadius: 7, overflow: 'hidden', position: 'relative' }} role="img" aria-label={`${c.title}: ${c.total} مسجلاً منهم ${c.paid} سدّدوا`}>
              <div style={{ position: 'absolute', inset: 0, width: `${(c.total / s.max) * 100}%`, background: '#ddd6fe' }} />
              <div style={{ position: 'absolute', inset: 0, width: `${(c.paid / s.max) * 100}%`, background: STATUS_META.paid.color }} />
            </div>
            <span style={{ flex: '0 0 auto', color: 'var(--mh-muted)' }}>{c.total} <span style={{ color: STATUS_META.paid.color }}>({c.paid} سدّد)</span></span>
          </div>
        ))}
        <div style={{ fontSize: 11, color: 'var(--mh-muted)', marginTop: 4 }}>الشريط الفاتح = إجمالي المسجلين، والغامق = من سدّد أو أتم الكورس.</div>
      </div>
    </div>
  );
}
