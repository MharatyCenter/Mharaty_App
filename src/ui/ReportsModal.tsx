import { useMemo, useState } from 'react';
import { useBackClose } from './useBackClose';
import { STATUS_META, STATUS_ORDER } from '../lib/messages';
import type { RegStatus } from '../lib/messages';
import { buildReport, downloadXlsx, printPdf } from '../lib/reports';
import type { ReportCourse, ReportKind, ReportReg } from '../lib/reports';

const field: React.CSSProperties = { padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, width: '100%', fontFamily: 'inherit', background: '#fff' };
const btn = (bg: string): React.CSSProperties => ({ background: bg, color: '#fff', border: 'none', padding: '9px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 });
const NON_CANCELLED = STATUS_ORDER.filter((s) => s !== 'cancelled');

export default function ReportsModal({ open, regs, courses, courseTitles, onClose }: { open: boolean; regs: ReportReg[]; courses: ReportCourse[]; courseTitles: string[]; onClose: () => void }) {
  useBackClose(open, onClose);
  const [kind, setKind] = useState<ReportKind>('roster');
  const [course, setCourse] = useState('all');
  const [statuses, setStatuses] = useState<RegStatus[]>(NON_CANCELLED);
  const [onlyOwing, setOnlyOwing] = useState(false);

  const report = useMemo(() => buildReport(kind, regs, courses, { course, statuses, onlyOwing }), [kind, regs, courses, course, statuses, onlyOwing]);
  if (!open) return null;
  const count = report.sections.reduce((s, x) => s + x.rows.length, 0);
  const toggle = (s: RegStatus) => setStatuses((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  const ok = count > 0;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 15 }}>
      <div role="dialog" aria-modal="true" aria-label="التقارير" onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 500, maxHeight: '92vh', overflowY: 'auto', padding: 20, direction: 'rtl', textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 style={{ margin: 0, color: '#2d3d52' }}>🖨️ تقارير المتدربين</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {([['roster', '📋 كشف المشتركين'], ['balance', '💰 الرسوم والأرصدة']] as [ReportKind, string][]).map(([k, l]) => (
            <button key={k} type="button" onClick={() => setKind(k)} style={{ ...btn(kind === k ? '#2d3d52' : '#e2e8f0'), color: kind === k ? '#fff' : '#2d3d52', flex: 1 }}>{l}</button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: '#64748b' }}>{kind === 'roster' ? 'قائمة بأسماء وبيانات المشتركين مقسمة حسب الكورس.' : 'لكل متدرب: رسوم الكورس والمدفوع والمتبقي، مع إجمالي كل كورس والإجمالي الكلي.'}</div>
        <label style={{ fontSize: 12, color: '#64748b' }}>الكورس</label>
        <select aria-label="الكورس" value={course} onChange={(e) => setCourse(e.target.value)} style={field}>
          <option value="all">كل الكورسات</option>
          {courseTitles.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <div style={{ fontSize: 12, color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>الحالات المشمولة</span>
          <span style={{ display: 'flex', gap: 6 }}>
            <button type="button" onClick={() => setStatuses(['completed'])} style={{ ...btn('#0e7490'), padding: '3px 9px', fontSize: 11 }}>المكتملون فقط</button>
            <button type="button" onClick={() => setStatuses(NON_CANCELLED)} style={{ ...btn('#64748b'), padding: '3px 9px', fontSize: 11 }}>بدون الملغين</button>
            <button type="button" onClick={() => setStatuses([...STATUS_ORDER])} style={{ ...btn('#64748b'), padding: '3px 9px', fontSize: 11 }}>الكل</button>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {STATUS_ORDER.map((s) => (
            <label key={s} style={{ fontSize: 12, background: STATUS_META[s].bg, color: STATUS_META[s].color, padding: '4px 8px', borderRadius: 12, cursor: 'pointer', opacity: statuses.includes(s) ? 1 : 0.45 }}>
              <input type="checkbox" checked={statuses.includes(s)} onChange={() => toggle(s)} style={{ marginLeft: 4 }} />{STATUS_META[s].label}
            </label>
          ))}
        </div>
        {kind === 'balance' && (
          <label style={{ fontSize: 13 }}><input type="checkbox" checked={onlyOwing} onChange={(e) => setOnlyOwing(e.target.checked)} style={{ marginLeft: 6 }} />من عليهم متبقي فقط</label>
        )}
        <div style={{ background: '#f8fafc', borderRadius: 8, padding: 10, fontSize: 13 }}>
          <b>{count}</b> متدرب في <b>{report.sections.length}</b> كورس
          {kind === 'balance' && report.grand ? <div style={{ marginTop: 4 }}>الرسوم: <b>{String(report.grand[4])}</b> · المدفوع: <b>{String(report.grand[5])}</b> · المتبقي: <b style={{ color: '#b91c1c' }}>{String(report.grand[6])}</b></div> : null}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" disabled={!ok} onClick={() => printPdf(report)} style={{ ...btn('#b91c1c'), opacity: ok ? 1 : 0.5 }}>📄 PDF / طباعة</button>
          <button type="button" disabled={!ok} onClick={() => downloadXlsx(report)} style={{ ...btn('#047857'), opacity: ok ? 1 : 0.5 }}>📊 Excel</button>
          <button type="button" onClick={onClose} style={btn('#94a3b8')}>إغلاق</button>
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>في نافذة الطباعة اختر «حفظ بتنسيق PDF» من قائمة الطابعة.</div>
      </div>
    </div>
  );
}
