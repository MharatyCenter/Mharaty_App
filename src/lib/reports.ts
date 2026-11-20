import { STATUS_META } from './messages';
import type { RegStatus } from './messages';
import { buildXlsx } from './xlsx';
import type { Cell, SheetRow } from './xlsx';

export interface ReportReg { course_title: string; student_name: string; phone?: string | null; national_id?: string | null; status: RegStatus; paid_amount?: number | null }
export interface ReportCourse { title: string; fee?: number | null }
export type ReportKind = 'roster' | 'balance';

export interface ReportSection { heading: string; note?: string; rows: Cell[][]; total?: Cell[] }
export interface Report { title: string; subtitle: string; head: string[]; sections: ReportSection[]; grand?: Cell[]; numericFrom: number }

const norm = (t: string) => t.replace(/\s+/g, ' ').trim().toLowerCase();
const money = (n: number) => Math.round(n * 100) / 100;

export function buildReport(kind: ReportKind, regs: ReportReg[], courses: ReportCourse[], opts: { course: string; statuses: RegStatus[]; onlyOwing: boolean }): Report {
  const feeOf = new Map(courses.map((c) => [norm(c.title), c.fee ?? null]));
  const list = regs.filter((r) => (opts.course === 'all' || r.course_title === opts.course) && opts.statuses.includes(r.status));
  const titles = [...new Set(list.map((r) => r.course_title))].sort();
  const stLabel = opts.statuses.length === 6 ? 'كل الحالات' : opts.statuses.map((s) => STATUS_META[s].label).join('، ');
  const subtitle = `${opts.course === 'all' ? 'كل الكورسات' : opts.course} — الحالات: ${stLabel}`;
  let gFee = 0, gPaid = 0, gRem = 0, gCount = 0;

  const sections: ReportSection[] = titles.map((t) => {
    const fee = feeOf.get(norm(t)) ?? null;
    let rows = list.filter((r) => r.course_title === t).sort((a, b) => a.student_name.localeCompare(b.student_name, 'ar'));
    if (kind === 'balance') {
      if (opts.onlyOwing) rows = rows.filter((r) => fee != null && fee - (Number(r.paid_amount) || 0) > 0);
      let sFee = 0, sPaid = 0, sRem = 0;
      const out = rows.map((r, i): Cell[] => {
        const paid = Number(r.paid_amount) || 0; const rem = fee != null ? money(fee - paid) : null;
        if (fee != null) { sFee += fee; sRem += rem as number; }
        sPaid += paid;
        return [i + 1, r.student_name, r.phone || '', STATUS_META[r.status].label, fee ?? 'غير محدد', paid, rem ?? '—'];
      });
      gFee += sFee; gPaid += sPaid; gRem += sRem; gCount += rows.length;
      return { heading: t, note: fee != null ? `رسوم الكورس: ${fee}` : 'رسوم الكورس غير محددة (حددها من إدارة الكورسات)', rows: out, total: ['', `الإجمالي (${rows.length})`, '', '', money(sFee), money(sPaid), money(sRem)] };
    }
    gCount += rows.length;
    return { heading: t, rows: rows.map((r, i): Cell[] => [i + 1, r.student_name, r.phone || '', r.national_id || '', STATUS_META[r.status].label]), total: ['', `العدد: ${rows.length}`, '', '', ''] };
  }).filter((s) => s.rows.length > 0);

  return kind === 'balance'
    ? { title: 'كشف الرسوم والأرصدة', subtitle, head: ['م', 'الاسم', 'الهاتف', 'الحالة', 'الرسوم', 'المدفوع', 'المتبقي'], sections, grand: ['', `الإجمالي الكلي (${gCount})`, '', '', money(gFee), money(gPaid), money(gRem)], numericFrom: 4 }
    : { title: 'كشف المشتركين', subtitle, head: ['م', 'الاسم', 'الهاتف', 'الرقم القومي', 'الحالة'], sections, grand: sections.length > 1 ? ['', `إجمالي المشتركين: ${gCount}`, '', '', ''] : undefined, numericFrom: 99 };
}

const today = () => new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

export function downloadXlsx(r: Report) {
  const rows: SheetRow[] = [{ cells: ['مركز مهاراتي للتدريب — ' + r.title], style: 'title' }, { cells: [r.subtitle + ' — ' + today()] }, { cells: [] }];
  r.sections.forEach((s) => {
    rows.push({ cells: [s.heading + (s.note ? ' — ' + s.note : '')], style: 'section' }, { cells: r.head, style: 'head' });
    s.rows.forEach((c) => rows.push({ cells: c }));
    if (s.total) rows.push({ cells: s.total, style: 'bold' });
    rows.push({ cells: [] });
  });
  if (r.grand) rows.push({ cells: r.grand, style: 'section' });
  const blob = buildXlsx(r.title, rows, r.head.map((h) => (h === 'الاسم' ? 30 : h === 'م' ? 6 : 18)));
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `${r.title}-${new Date().toISOString().slice(0, 10)}.xlsx`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

const h = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function printPdf(r: Report) {
  const th = r.head.map((x) => `<th>${h(x)}</th>`).join('');
  const tr = (c: Cell[], cls = '') => `<tr class="${cls}">${c.map((v, i) => `<td class="${i >= r.numericFrom ? 'n' : ''}">${h(v)}</td>`).join('')}</tr>`;
  const body = r.sections.map((s) => `<h3>${h(s.heading)}${s.note ? ` <small>— ${h(s.note)}</small>` : ''}</h3><table><thead><tr>${th}</tr></thead><tbody>${s.rows.map((x) => tr(x)).join('')}${s.total ? tr(s.total, 'tot') : ''}</tbody></table>`).join('');
  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${h(r.title)}</title><style>
@page{size:A4;margin:14mm}body{font-family:Tahoma,Arial,sans-serif;color:#111;font-size:12px}
.hd{text-align:center;border-bottom:2px solid #2d3d52;padding-bottom:8px;margin-bottom:10px}.hd h1{margin:0;font-size:18px;color:#2d3d52}.hd p{margin:3px 0;color:#444}
h3{margin:16px 0 6px;font-size:14px;color:#2d3d52}h3 small{font-weight:normal;color:#555;font-size:12px}
table{width:100%;border-collapse:collapse;margin-bottom:6px;page-break-inside:auto}tr{page-break-inside:avoid}thead{display:table-header-group}
th{background:#2d3d52;color:#fff;padding:5px 6px;border:1px solid #2d3d52;text-align:right}td{padding:4px 6px;border:1px solid #cbd5e1}td.n{text-align:center}
tr.tot td{background:#e2e8f0;font-weight:bold}.grand{margin-top:14px;padding:8px;border:2px solid #2d3d52;font-weight:bold}.grand span{display:inline-block;margin-left:18px}
</style></head><body><div class="hd"><h1>مركز مهاراتي للتدريب</h1><p><b>${h(r.title)}</b></p><p>${h(r.subtitle)}</p><p>تاريخ الإصدار: ${h(today())}</p></div>${body}${r.grand ? `<div class="grand">${r.grand.filter((v) => v !== '' && v != null).map((v, i) => `<span>${i === 0 ? '' : ['الرسوم', 'المدفوع', 'المتبقي'][i - 1] ? ['الرسوم: ', 'المدفوع: ', 'المتبقي: '][i - 1] : ''}${h(v)}</span>`).join('')}</div>` : ''}</body></html>`;
  const f = document.createElement('iframe');
  f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.appendChild(f);
  const d = f.contentWindow!.document; d.open(); d.write(html); d.close();
  setTimeout(() => { f.contentWindow!.focus(); f.contentWindow!.print(); setTimeout(() => f.remove(), 60000); }, 400);
}
