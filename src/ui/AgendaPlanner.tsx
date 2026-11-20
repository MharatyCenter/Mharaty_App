import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';

interface CourseLite { title: string; start_date?: string | null; end_date?: string | null }
interface Item { id: number; title: string; notes?: string | null; item_date: string; item_time?: string | null; kind: Kind; is_done: boolean }
type Kind = 'task' | 'meeting' | 'deadline' | 'other';

const KINDS: Record<Kind, { label: string; icon: string; color: string }> = {
  task: { label: 'مهمة', icon: '📌', color: '#1d4ed8' },
  meeting: { label: 'اجتماع', icon: '👥', color: '#7e22ce' },
  deadline: { label: 'موعد نهائي', icon: '⏳', color: '#b91c1c' },
  other: { label: 'أخرى', icon: '🗒️', color: '#475569' },
};
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const WEEK = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
const pad = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const field: React.CSSProperties = { padding: '8px 10px', borderRadius: 8, border: '1px solid var(--mh-border)', fontSize: 14, fontFamily: 'inherit', background: '#fff' };

/** أجندة الشهر: مهام ومواعيد يدوية + بداية/نهاية الكورسات تظهر تلقائياً */
export default function AgendaPlanner({ courses }: { courses: CourseLite[] }) {
  const now = new Date();
  const todayIso = iso(now.getFullYear(), now.getMonth(), now.getDate());
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [sel, setSel] = useState(todayIso);
  const [items, setItems] = useState<Item[]>([]);
  const [err, setErr] = useState('');
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [kind, setKind] = useState<Kind>('task');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const first = iso(year, month, 1);
  const last = iso(year, month, new Date(year, month + 1, 0).getDate());

  const load = useCallback(async () => {
    const { data, error } = await supabase.schema('mharaty').from('agenda_items').select('*')
      .gte('item_date', first).lte('item_date', last).order('item_time', { nullsFirst: false });
    if (error) { setErr(error.code === '42P01' || /agenda_items/.test(error.message) ? 'جدول الأجندة غير موجود بعد: شغّل ملف migration_agenda.sql في Supabase.' : error.message); return; }
    setErr(''); setItems((data || []) as Item[]);
  }, [first, last]);
  useEffect(() => { void load(); }, [load]);

  const courseEvents = useMemo(() => {
    const out: { date: string; text: string; icon: string }[] = [];
    courses.forEach((c) => {
      if (c.start_date) out.push({ date: c.start_date, text: `بداية كورس «${c.title}»`, icon: '🚀' });
      if (c.end_date) out.push({ date: c.end_date, text: `نهاية كورس «${c.title}»`, icon: '🏁' });
    });
    return out;
  }, [courses]);

  const byDay = useMemo(() => {
    const m = new Map<string, { items: Item[]; ev: typeof courseEvents }>();
    const get = (d: string) => { if (!m.has(d)) m.set(d, { items: [], ev: [] }); return m.get(d)!; };
    items.forEach((i) => get(i.item_date).items.push(i));
    courseEvents.forEach((e) => { if (e.date >= first && e.date <= last) get(e.date).ev.push(e); });
    return m;
  }, [items, courseEvents, first, last]);

  const offset = (new Date(year, month, 1).getDay() + 1) % 7; // الأسبوع يبدأ السبت
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];

  const shift = (d: number) => {
    const t = new Date(year, month + d, 1); setYear(t.getFullYear()); setMonth(t.getMonth());
    setSel(iso(t.getFullYear(), t.getMonth(), 1));
  };
  const goToday = () => { setYear(now.getFullYear()); setMonth(now.getMonth()); setSel(todayIso); };

  const add = async () => {
    if (!title.trim()) return;
    setBusy(true);
    const { error } = await supabase.schema('mharaty').from('agenda_items').insert({
      title: title.trim(), notes: notes.trim() || null, item_date: sel, item_time: time || null, kind,
    });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setTitle(''); setNotes(''); setTime(''); await load();
  };
  const toggle = async (i: Item) => {
    setItems((p) => p.map((x) => (x.id === i.id ? { ...x, is_done: !x.is_done } : x)));
    const { error } = await supabase.schema('mharaty').from('agenda_items').update({ is_done: !i.is_done }).eq('id', i.id);
    if (error) { setErr(error.message); void load(); }
  };
  const remove = async (i: Item) => {
    if (!window.confirm(`حذف «${i.title}»؟`)) return;
    const { error } = await supabase.schema('mharaty').from('agenda_items').delete().eq('id', i.id);
    if (error) setErr(error.message); else void load();
  };

  const total = items.length, done = items.filter((i) => i.is_done).length;
  const overdue = items.filter((i) => !i.is_done && i.item_date < todayIso).length;
  const upcoming = items.filter((i) => !i.is_done && i.item_date >= todayIso).length;
  const day = byDay.get(sel) || { items: [], ev: [] };
  const selDate = new Date(sel + 'T00:00:00');

  return (
    <div>
      <h2 style={{ margin: '0 0 12px', color: 'var(--mh-navy)' }}>🗓️ أجندة تخطيط العمل</h2>
      {err ? <div role="alert" style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8, marginBottom: 10, fontSize: 13 }}>{err}</div> : null}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {[['مهام الشهر', total, '#1d4ed8'], ['منجزة', done, '#047857'], ['قادمة', upcoming, '#b45309'], ['متأخرة', overdue, '#b91c1c']].map(([l, v, c]) => (
          <div key={l as string} style={{ flex: '1 1 110px', background: '#fff', border: '1px solid var(--mh-border)', borderRight: `4px solid ${c}`, borderRadius: 10, padding: '8px 12px' }}>
            <div style={{ fontSize: 12, color: 'var(--mh-muted)' }}>{l}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--mh-navy)' }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--mh-border)', borderRadius: 12, padding: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 6 }}>
          <button type="button" aria-label="الشهر السابق" onClick={() => shift(-1)} style={{ ...field, cursor: 'pointer' }}>›</button>
          <div style={{ fontWeight: 700, color: 'var(--mh-navy)', fontSize: 16 }}>{MONTHS[month]} {year}
            <button type="button" onClick={goToday} style={{ ...field, marginRight: 8, padding: '3px 8px', fontSize: 12, cursor: 'pointer' }}>اليوم</button>
          </div>
          <button type="button" aria-label="الشهر التالي" onClick={() => shift(1)} style={{ ...field, cursor: 'pointer' }}>‹</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center' }}>
          {WEEK.map((w) => <div key={w} style={{ fontSize: 11, color: 'var(--mh-muted)', padding: '2px 0' }}>{w}</div>)}
          {cells.map((d, idx) => {
            if (!d) return <div key={`e${idx}`} />;
            const key = iso(year, month, d); const info = byDay.get(key);
            const isSel = key === sel, isToday = key === todayIso;
            const n = (info?.items.length || 0) + (info?.ev.length || 0);
            const pending = info?.items.some((i) => !i.is_done);
            return (
              <button type="button" key={key} onClick={() => setSel(key)} aria-label={`يوم ${d}`}
                style={{ minHeight: 52, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', border: isToday ? '2px solid #f59e0b' : '1px solid var(--mh-border)', background: isSel ? '#2d3d52' : '#fff', color: isSel ? '#fff' : 'var(--mh-navy)', padding: 2 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{d}</div>
                {n > 0 ? <div style={{ fontSize: 10, marginTop: 2, color: isSel ? '#fde68a' : pending ? '#b45309' : '#047857' }}>{info?.ev.length ? '● ' : ''}{n} {n === 1 ? 'بند' : 'بنود'}</div> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--mh-border)', borderRadius: 12, padding: 12 }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 15, color: 'var(--mh-navy)' }}>
          {selDate.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}
        </h3>
        {day.ev.map((e, i) => <div key={i} style={{ padding: '6px 10px', background: '#ecfeff', borderRadius: 8, marginBottom: 6, fontSize: 13 }}>{e.icon} {e.text}</div>)}
        {day.items.length === 0 && day.ev.length === 0 ? <div style={{ color: 'var(--mh-muted)', fontSize: 13, marginBottom: 8 }}>لا توجد بنود في هذا اليوم.</div> : null}
        {day.items.map((i) => (
          <div key={i.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', border: '1px solid var(--mh-border)', borderRight: `4px solid ${KINDS[i.kind].color}`, borderRadius: 8, marginBottom: 6, opacity: i.is_done ? 0.6 : 1 }}>
            <input type="checkbox" aria-label="تم" checked={i.is_done} onChange={() => toggle(i)} style={{ marginTop: 4, width: 18, height: 18 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, textDecoration: i.is_done ? 'line-through' : 'none' }}>{KINDS[i.kind].icon} {i.title}</div>
              <div style={{ fontSize: 11, color: 'var(--mh-muted)' }}>{KINDS[i.kind].label}{i.item_time ? ` • ${i.item_time}` : ''}</div>
              {i.notes ? <div style={{ fontSize: 12, marginTop: 2, whiteSpace: 'pre-wrap' }}>{i.notes}</div> : null}
            </div>
            <button type="button" aria-label="حذف" onClick={() => remove(i)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 16 }}>🗑️</button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          <input aria-label="عنوان البند" placeholder="إضافة بند لهذا اليوم…" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void add(); }} style={{ ...field, flex: '1 1 180px' }} />
          <select aria-label="النوع" value={kind} onChange={(e) => setKind(e.target.value as Kind)} style={field}>
            {(Object.keys(KINDS) as Kind[]).map((k) => <option key={k} value={k}>{KINDS[k].label}</option>)}
          </select>
          <input aria-label="الوقت" type="time" value={time} onChange={(e) => setTime(e.target.value)} style={field} />
          <input aria-label="ملاحظات" placeholder="ملاحظات (اختياري)" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ ...field, flex: '1 1 100%' }} />
          <button type="button" disabled={busy || !title.trim()} onClick={add} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#2d3d52', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: busy || !title.trim() ? 0.5 : 1 }}>إضافة</button>
        </div>
      </div>
    </div>
  );
}
