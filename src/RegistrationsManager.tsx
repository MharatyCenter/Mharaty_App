import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabaseClient';
import { isSheetsEnabled, sheetsViewUrl, sendBackfillBatch, sendStatusToSheet, requestSheetToApp } from './lib/sheets';
import { newId, toWhatsAppNumber } from './lib/validation';
import { useToast } from './ui/Toast';
import RegistrationsSummary from './ui/RegistrationsSummary';
import EditRegistrationModal from './ui/EditRegistrationModal';
import {
  DEFAULT_TEMPLATES, MESSAGE_META, MESSAGE_ORDER, PAYMENT_PLACEHOLDER_MARK, PLACEHOLDERS, STATUS_META, STATUS_ORDER,
  daysUntil, fillTemplate, formatArabicDate,
} from './lib/messages';
import type { MessageKind, RegStatus } from './lib/messages';

export interface CourseInfo {
  title: string;
  fee?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  schedule?: string | null;
}

interface RegistrationRow {
  id: number;
  client_id?: string | null;
  course_title: string;
  student_name: string;
  national_id?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  training_type?: string | null;
  education?: string | null;
  workplace?: string | null;
  job_title?: string | null;
  status: RegStatus;
  notes?: string | null;
  paid_amount?: number | null;
  status_updated_at?: string | null;
  msg_registered_at?: string | null;
  msg_payment_request_at?: string | null;
  msg_paid_at?: string | null;
  msg_reminder_at?: string | null;
  msg_completed_at?: string | null;
  msg_cancelled_at?: string | null;
  created_at: string;
}

type Templates = Record<MessageKind, { title: string; body: string }>;
type StatusFilter = 'all' | 'due' | 'ended' | RegStatus;

interface Props {
  courses: CourseInfo[];
  onCountChange?: (count: number) => void;
}

const btn = (bg: string): React.CSSProperties => ({
  backgroundColor: bg, color: '#fff', border: 'none', padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
});
const fieldStyle: React.CSSProperties = { padding: '7px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', width: '100%' };

const fmtDateTime = (iso?: string | null) => (iso ? new Date(iso).toLocaleString('ar-EG') : '');

const norm = (t?: string | null) => (t ?? '').replace(/\s+/g, ' ').trim();

export default function RegistrationsManager({ courses, onCountChange }: Props) {
  // إشعارات ثابتة أعلى الشاشة (تظهر حتى لو كنت في أسفل القائمة)
  const toast = useToast();
  const notify = (text: string, type: 'success' | 'error') => (type === 'error' ? toast.error(text) : toast.success(text));
  const [rows, setRows] = useState<RegistrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [templates, setTemplates] = useState<Templates>(DEFAULT_TEMPLATES);
  const [showTemplates, setShowTemplates] = useState(false);
  const [savingTemplates, setSavingTemplates] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editing, setEditing] = useState<RegistrationRow | null>(null);
  const [syncBusy, setSyncBusy] = useState<'' | 'from' | 'to'>('');
  const [syncProgress, setSyncProgress] = useState('');

  const courseMap = useMemo(() => new Map(courses.map((c) => [norm(c.title), c])), [courses]);
  const courseOf = (title: string) => courseMap.get(norm(title));

  const load = useCallback(async (silent = false): Promise<number | null> => {
    if (!silent) setLoading(true);
    setLoadError('');
    const [regs, tpls] = await Promise.all([
      supabase.schema('mharaty').from('course_registrations').select('*').order('created_at', { ascending: false }),
      supabase.schema('mharaty').from('message_templates').select('*'),
    ]);
    let count: number | null = null;
    if (regs.error) {
      setLoadError(regs.error.message);
    } else {
      count = (regs.data || []).length;
      setRows((regs.data || []).map((r) => ({ ...r, status: (r.status as RegStatus) || 'new' })));
    }
    if (!tpls.error && tpls.data && tpls.data.length > 0) {
      setTemplates((prev) => {
        const next = { ...prev };
        tpls.data.forEach((t: { key: string; title: string; body: string }) => {
          if (t.key in next) next[t.key as MessageKind] = { title: t.title, body: t.body };
        });
        return next;
      });
    }
    setLoading(false);
    return count;
  }, []);

  useEffect(() => { load(); }, [load]);
  // عند الرجوع للتطبيق (مثلاً بعد إضافة صفوف في الشيت وتزامنها) نحدّث القائمة بصمت
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') load(true); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [load]);
  useEffect(() => { onCountChange?.(rows.length); }, [rows.length, onCountChange]);

  // ===== تحديث صف (تفاؤلي مع تراجع عند الخطأ) =====
  const updateRow = async (id: number, patch: Partial<RegistrationRow>): Promise<boolean> => {
    const before = rows.find((r) => r.id === id);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    const { error } = await supabase.schema('mharaty').from('course_registrations').update(patch).eq('id', id);
    if (error) {
      if (before) setRows((prev) => prev.map((r) => (r.id === id ? before : r)));
      notify(error.code === '23505' ? 'هذا الرقم القومي مسجَّل بالفعل في هذا الكورس لمتدرب آخر.' : 'تعذر الحفظ: ' + error.message, 'error');
      return false;
    }
    return true;
  };

  const changeStatus = async (row: RegistrationRow, status: RegStatus) => {
    if (status === row.status) return;
    const ok = await updateRow(row.id, { status, status_updated_at: new Date().toISOString() });
    if (ok) {
      sendStatusToSheet(row.client_id, STATUS_META[status].label);
      notify(`تم تغيير الحالة إلى «${STATUS_META[status].label}»`, 'success');
    }
  };

  // ===== إرسال رسالة واتساب (يفتح المحادثة برسالة جاهزة) =====
  const sendWhatsApp = (row: RegistrationRow, kind: MessageKind) => {
    const course = courseOf(row.course_title);
    const body = templates[kind].body;

    if (body.includes(PAYMENT_PLACEHOLDER_MARK)) {
      notify('عدّل قالب الرسالة أولاً وأضف بيانات السداد الحقيقية (من "قوالب الرسائل").', 'error');
      setShowTemplates(true);
      return;
    }
    if (kind === 'payment_request' && !course?.fee) {
      notify('حدد رسوم الكورس أولاً من تبويب الكورسات.', 'error');
      return;
    }
    const number = toWhatsAppNumber(row.phone ?? '');
    if (number.length < 8) {
      notify(row.phone ? 'رقم الواتساب غير صالح.' : 'لا يوجد رقم واتساب لهذا المتدرب. أضفه من زر «تعديل البيانات».', 'error');
      return;
    }

    if ((kind === 'payment_request' || kind === 'reminder') && (row.status === 'cancelled' || row.status === 'completed')) {
      if (!window.confirm(`حالة المتدرب «${STATUS_META[row.status].label}». هل تريد إرسال «${MESSAGE_META[kind].label}» رغم ذلك؟`)) return;
    }
    if (kind === 'completed' && row.status !== 'paid' && row.status !== 'completed') {
      if (!window.confirm(`المتدرب لم يُسدد بعد (الحالة: ${STATUS_META[row.status].label}). هل تريد إرسال رسالة إتمام الكورس؟`)) return;
    }
    if (kind === 'cancelled' && row.status !== 'cancelled') {
      if (!window.confirm(`سيتم إلغاء اشتراك «${row.student_name}» وتغيير حالته إلى «ملغي». متابعة؟`)) return;
    }

    const text = fillTemplate(body, {
      name: row.student_name,
      course: row.course_title,
      fee: course?.fee,
      startDate: course?.start_date,
      schedule: course?.schedule,
      trainingType: row.training_type,
    });

    // نفتح واتساب أولاً (قبل أي await) حتى لا يحجبه المتصفح
    const waUrl = `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
    console.info('[WhatsApp]', kind, waUrl);
    if (!window.open(waUrl, '_blank', 'noopener,noreferrer')) {
      notify('المتصفح منع فتح واتساب. اسمح بالنوافذ المنبثقة لهذا الموقع ثم أعد المحاولة.', 'error');
    }

    const meta = MESSAGE_META[kind];
    const patch: Partial<RegistrationRow> = { [meta.sentField]: new Date().toISOString() } as Partial<RegistrationRow>;
    const moveStatus = meta.nextStatus && meta.nextStatus !== row.status && (kind === 'cancelled' || (row.status !== 'cancelled' && (!meta.onlyFrom || meta.onlyFrom.includes(row.status))));
    if (moveStatus && meta.nextStatus) {
      patch.status = meta.nextStatus;
      patch.status_updated_at = new Date().toISOString();
    }
    updateRow(row.id, patch).then((ok) => {
      if (ok && moveStatus && meta.nextStatus) sendStatusToSheet(row.client_id, STATUS_META[meta.nextStatus].label);
    });
  };

  // ===== قوالب الرسائل =====
  const saveTemplates = async () => {
    setSavingTemplates(true);
    const payload = MESSAGE_ORDER.map((k) => ({ key: k, title: templates[k].title, body: templates[k].body, updated_at: new Date().toISOString() }));
    const { error } = await supabase.schema('mharaty').from('message_templates').upsert(payload, { onConflict: 'key' });
    setSavingTemplates(false);
    if (error) notify('تعذر حفظ القوالب (هل شغّلت ملف التحديث في Supabase؟): ' + error.message, 'error');
    else notify('✅ تم حفظ قوالب الرسائل', 'success');
  };

  // ===== إنهاء كورس: تحويل كل المسددين إلى "مكتمل" =====
  const finishCourse = async () => {
    const targets = rows.filter((r) => norm(r.course_title) === norm(courseFilter) && r.status === 'paid');
    if (targets.length === 0) { notify('لا يوجد متدربون بحالة «تم السداد» في هذا الكورس.', 'error'); return; }
    if (!window.confirm(`سيتم تحويل ${targets.length} متدرب إلى «مكتمل» في كورس «${courseFilter}». متابعة؟`)) return;
    const now = new Date().toISOString();
    const ids = targets.map((t) => t.id);
    const { error } = await supabase.schema('mharaty').from('course_registrations')
      .update({ status: 'completed', status_updated_at: now }).in('id', ids);
    if (error) { notify('تعذر الإنهاء: ' + error.message, 'error'); return; }
    setRows((prev) => prev.map((r) => (ids.includes(r.id) ? { ...r, status: 'completed', status_updated_at: now } : r)));
    notify(`🏁 تم إنهاء الكورس لعدد ${targets.length} متدرب`, 'success');
    // مزامنة الشيت بالتتابع حتى لا تتزاحم الطلبات
    (async () => { for (const t of targets) await sendStatusToSheet(t.client_id, STATUS_META.completed.label); })();
  };

  // ===== التصفية =====
  const isDue = (r: RegistrationRow) => {
    if (r.status !== 'paid' || r.msg_reminder_at) return false;
    const d = daysUntil(courseOf(r.course_title)?.start_date);
    return d !== null && d >= 0 && d <= 7;
  };

  const isEnded = (r: RegistrationRow) => {
    if (r.status !== 'paid') return false;
    const d = daysUntil(courseOf(r.course_title)?.end_date);
    return d !== null && d < 0;
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length, due: 0, ended: 0 };
    STATUS_ORDER.forEach((s) => { c[s] = 0; });
    rows.forEach((r) => {
      c[r.status] = (c[r.status] || 0) + 1;
      if (isDue(r)) c.due += 1;
      if (isEnded(r)) c.ended += 1;
    });
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, courseMap]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter === 'due') { if (!isDue(r)) return false; }
      else if (statusFilter === 'ended') { if (!isEnded(r)) return false; }
      else if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (courseFilter !== 'all' && norm(r.course_title) !== norm(courseFilter)) return false;
      if (q) {
        const hay = `${r.student_name} ${r.phone} ${r.national_id ?? ''} ${r.course_title} ${r.email ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, statusFilter, courseFilter, search, courseMap]);

  const courseTitles = useMemo(() => Array.from(new Set(rows.map((r) => r.course_title))).sort(), [rows]);

  // ===== حذف متدرب =====
  const deleteRow = async (r: RegistrationRow) => {
    const extra = isSheetsEnabled ? '\nملاحظة: لن يُحذف من Google Sheet، احذف صفه هناك يدوياً إن أردت.' : '';
    if (!window.confirm(`حذف «${r.student_name}» (${r.course_title}) نهائياً من التطبيق؟ لا يمكن التراجع.${extra}`)) return;
    const { error } = await supabase.schema('mharaty').from('course_registrations').delete().eq('id', r.id);
    if (error) { notify('تعذر الحذف: ' + error.message, 'error'); return; }
    setRows((prev) => prev.filter((x) => x.id !== r.id));
    notify('تم حذف المتدرب', 'success');
  };

  // ===== ربط اسم كورس قديم (غير مطابق) بكورس موجود في التطبيق =====
  const [relinkChoice, setRelinkChoice] = useState<Record<string, string>>({});
  const unmatched = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r) => { if (!courseMap.has(norm(r.course_title))) m.set(norm(r.course_title), (m.get(norm(r.course_title)) || 0) + 1); });
    return Array.from(m.entries()).map(([title, count]) => ({ title, count }));
  }, [rows, courseMap]);

  const relinkCourse = async (oldTitle: string) => {
    const target = relinkChoice[oldTitle];
    if (!target) { notify('اختر الكورس الصحيح من القائمة أولاً.', 'error'); return; }
    const ids = rows.filter((r) => norm(r.course_title) === oldTitle).map((r) => r.id);
    if (!window.confirm(`تغيير اسم الكورس لـ ${ids.length} متدرب من «${oldTitle}» إلى «${target}»؟`)) return;
    const { error } = await supabase.schema('mharaty').from('course_registrations').update({ course_title: target }).in('id', ids);
    if (error) { notify(error.code === '23505' ? 'تعذر الربط: يوجد متدرب مسجل بنفس الرقم القومي في الكورس الهدف. عدّل المتدربين فرادى.' : 'تعذر الربط: ' + error.message, 'error'); return; }
    setRows((prev) => prev.map((r) => (ids.includes(r.id) ? { ...r, course_title: target } : r)));
    notify(`✅ تم ربط ${ids.length} متدرب بكورس «${target}»`, 'success');
  };

  // ===== المزامنة مع Google Sheet =====
  // من الشيت إلى التطبيق: السكربت ينقل الصفوف المكتوبة يدوياً إلى قاعدة بيانات التطبيق، ثم نحدّث القائمة
  const syncFromSheet = async () => {
    setSyncBusy('from');
    try {
      const before = rows.length;
      const sent = await requestSheetToApp();
      if (!sent) { notify('تعذر الاتصال بالشيت. تحقق من الإنترنت ومن رابط الشيت في الإعدادات.', 'error'); return; }
      const after = await load(true);
      if (after === null) { notify('تمت المزامنة لكن تعذر تحديث القائمة. اضغط «تحديث».', 'error'); return; }
      const diff = after - before;
      notify(diff > 0 ? `✅ تم نقل ${diff} متدرب من الشيت إلى التطبيق` : 'لا توجد صفوف جديدة للنقل. (الصف يلزمه: الاسم، رقم قومي 14 رقماً، واتساب، كورس)', diff > 0 ? 'success' : 'error');
    } finally {
      setSyncBusy('');
    }
  };

  // من التطبيق إلى الشيت: نرسل كل المتدربين على دفعات، والشيت يتخطى من هو موجود عنده
  const syncToSheet = async () => {
    if (rows.length === 0) { notify('لا يوجد متدربون في التطبيق لنقلهم.', 'error'); return; }
    if (!window.confirm(`سيتم إرسال ${rows.length} متدرب من التطبيق إلى الشيت. من هو موجود بالفعل في الشيت يُتخطى تلقائياً ولن يتكرر. متابعة؟`)) return;
    setSyncBusy('to');
    try {
      // كل متدرب يحتاج معرّفاً ليتزامن تغيير حالته مع الشيت لاحقاً
      const list: RegistrationRow[] = [];
      for (const r of rows) {
        let cid = r.client_id;
        if (!cid) {
          cid = newId();
          const { error } = await supabase.schema('mharaty').from('course_registrations').update({ client_id: cid }).eq('id', r.id);
          if (error) { notify('تعذر تجهيز بيانات «' + r.student_name + '»: ' + error.message, 'error'); continue; }
          setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, client_id: cid } : x)));
        }
        list.push({ ...r, client_id: cid });
      }
      let done = 0, failedBatches = 0;
      for (let i = 0; i < list.length; i += 25) {
        const chunk = list.slice(i, i + 25);
        setSyncProgress(`${Math.min(i + 25, list.length)} / ${list.length}`);
        const ok = await sendBackfillBatch(chunk.map((r) => ({
          id: r.client_id as string, course_title: r.course_title, student_name: r.student_name, national_id: r.national_id ?? '',
          phone: r.phone ?? '', email: r.email ?? '', address: r.address ?? '', training_type: r.training_type ?? '', education: r.education ?? '',
          workplace: r.workplace ?? '', job_title: r.job_title ?? '', status: STATUS_META[r.status].label, notes: r.notes ?? '', created_at: r.created_at,
        })));
        if (ok) done += chunk.length; else failedBatches += 1;
      }
      notify(failedBatches ? `أُرسل ${done} من ${list.length}، وفشلت ${failedBatches} دفعة. أعد المحاولة.` : `✅ أُرسل ${done} متدرب إلى الشيت. افتح الشيت للتأكد.`, failedBatches ? 'error' : 'success');
    } finally {
      setSyncBusy('');
      setSyncProgress('');
    }
  };

  // ===== تصدير CSV =====
  const exportCsv = () => {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header = ['الاسم', 'الرقم القومي', 'واتساب', 'البريد الإلكتروني', 'العنوان', 'نوع التدريب', 'المؤهل', 'جهة العمل', 'الوظيفة', 'الكورس', 'الحالة', 'المبلغ المدفوع', 'ملاحظات', 'تاريخ التسجيل'];
    const data = filtered.map((r) => [
      r.student_name, '\t' + (r.national_id ?? ''), '\t' + (r.phone ?? ''), r.email, r.address, r.training_type, r.education, r.workplace, r.job_title,
      r.course_title, STATUS_META[r.status].label, r.paid_amount, r.notes, new Date(r.created_at).toLocaleString('ar-EG'),
    ]);
    const csv = '﻿' + [header, ...data].map((row) => row.map(esc).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ===== الواجهة =====
  const chip = (key: StatusFilter, label: string, color: string, bg: string) => {
    const active = statusFilter === key;
    return (
      <button key={key} onClick={() => setStatusFilter(key)} style={{
        border: `2px solid ${active ? color : 'transparent'}`, backgroundColor: bg, color, padding: '6px 12px', borderRadius: '20px',
        cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', whiteSpace: 'nowrap',
      }}>
        {label} ({counts[key] ?? 0})
      </button>
    );
  };

  return (
    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
        <h3 style={{ color: '#2d3d52', margin: 0, fontSize: '16px' }}>📝 إدارة المتدربين والتسجيلات</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => setShowTemplates((v) => !v)} style={btn('#8b44db')}>✏️ قوالب الرسائل</button>
          {isSheetsEnabled && sheetsViewUrl && (
            <a href={sheetsViewUrl} target="_blank" rel="noreferrer" style={{ ...btn('#10b981'), textDecoration: 'none', display: 'inline-block' }}>📊 فتح Google Sheet</a>
          )}
          {isSheetsEnabled && (
            <>
              <button onClick={syncFromSheet} disabled={syncBusy !== ''} style={{ ...btn('#0e7490'), opacity: syncBusy ? 0.6 : 1 }}>
                {syncBusy === 'from' ? '⏳ جاري النقل...' : '⬇️ من الشيت إلى التطبيق'}
              </button>
              <button onClick={syncToSheet} disabled={syncBusy !== ''} style={{ ...btn('#b45309'), opacity: syncBusy ? 0.6 : 1 }}>
                {syncBusy === 'to' ? `⏳ جاري الإرسال ${syncProgress}` : '⬆️ من التطبيق إلى الشيت'}
              </button>
            </>
          )}
          <button onClick={exportCsv} disabled={filtered.length === 0} style={{ ...btn('#2d3d52'), opacity: filtered.length === 0 ? 0.5 : 1 }}>⬇️ تصدير CSV</button>
          <button onClick={() => load()} style={btn('#64748b')}>🔄 تحديث</button>
        </div>
      </div>

      {showTemplates && (
        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '15px', marginBottom: '18px' }}>
          <h4 style={{ margin: '0 0 6px', color: '#2d3d52' }}>قوالب رسائل الواتساب</h4>
          <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#64748b' }}>
            يمكنك استخدام هذه المتغيرات داخل النص وسيتم استبدالها ببيانات المتدرب والكورس:{' '}
            {PLACEHOLDERS.map((p) => <code key={p} style={{ direction: 'ltr', display: 'inline-block', backgroundColor: '#e2e8f0', padding: '1px 6px', borderRadius: '4px', margin: '0 2px' }}>{p}</code>)}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {MESSAGE_ORDER.map((k) => (
              <div key={k}>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', marginBottom: '5px', color: '#334155' }}>
                  <span>{MESSAGE_META[k].icon} {templates[k].title}</span>
                  <button type="button" onClick={() => setTemplates((t) => ({ ...t, [k]: DEFAULT_TEMPLATES[k] }))} style={{ background: 'none', border: 'none', color: '#8b44db', cursor: 'pointer', fontSize: '12px' }}>استعادة الافتراضي</button>
                </label>
                <textarea
                  value={templates[k].body}
                  onChange={(e) => setTemplates((t) => ({ ...t, [k]: { ...t[k], body: e.target.value } }))}
                  rows={8}
                  style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.6 }}
                />
              </div>
            ))}
          </div>
          <div style={{ marginTop: '12px', display: 'flex', gap: '10px' }}>
            <button onClick={saveTemplates} disabled={savingTemplates} style={btn('#2d3d52')}>{savingTemplates ? 'جاري الحفظ...' : '💾 حفظ القوالب'}</button>
            <button onClick={() => setShowTemplates(false)} style={btn('#94a3b8')}>إغلاق</button>
          </div>
        </div>
      )}

      {!loading && !loadError && unmatched.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: '10px 12px', marginBottom: 14 }}>
          <div style={{ fontWeight: 'bold', fontSize: 13, color: '#92400e', marginBottom: 6 }}>⚠️ متدربون في كورسات غير مطابقة لأي كورس في التطبيق (لن تظهر لهم الرسوم والمواعيد في الرسائل)</div>
          {courses.length === 0 && <div style={{ fontSize: 12, color: '#92400e' }}>أضف الكورس أولاً من تبويب «إدارة الكورسات» ثم ارجع هنا لربطهم به.</div>}
          {unmatched.map((u) => (
            <div key={u.title} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6, fontSize: 12 }}>
              <b style={{ flex: '1 1 160px' }}>«{u.title}» ({u.count} متدرب)</b>
              <select value={relinkChoice[u.title] ?? ''} onChange={(e) => setRelinkChoice((p) => ({ ...p, [u.title]: e.target.value }))} style={{ ...fieldStyle, width: 'auto', flex: '1 1 180px', backgroundColor: '#fff' }}>
                <option value="">اربطهم بكورس...</option>
                {courses.map((c) => <option key={c.title} value={c.title}>{c.title}</option>)}
              </select>
              <button onClick={() => relinkCourse(u.title)} disabled={courses.length === 0} style={btn('#b45309')}>ربط</button>
            </div>
          ))}
        </div>
      )}

      {!loading && !loadError && <RegistrationsSummary rows={rows} />}

      {/* ملخص الحالات */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {chip('all', 'الكل', '#2d3d52', '#e2e8f0')}
        {STATUS_ORDER.map((s) => chip(s, STATUS_META[s].label, STATUS_META[s].color, STATUS_META[s].bg))}
        {chip('due', '⏰ تذكيرات مستحقة', '#be123c', '#ffe4e6')}
        {chip('ended', '🏁 انتهت دوراتهم', '#0e7490', '#cffafe')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '16px' }}>
        <input type="search" placeholder="🔍 بحث بالاسم أو الهاتف أو الرقم القومي..." value={search} onChange={(e) => setSearch(e.target.value)} style={fieldStyle} />
        <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} style={{ ...fieldStyle, backgroundColor: '#fff' }}>
          <option value="all">كل الكورسات</option>
          {courseTitles.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        {courseFilter !== 'all' && (
          <button onClick={finishCourse} style={btn('#0e7490')}>🏁 إنهاء الكورس (تحويل المسددين إلى مكتمل)</button>
        )}
      </div>

      {loading ? (
        <p>جاري التحميل...</p>
      ) : loadError ? (
        <p style={{ color: '#b91c1c', fontSize: '13px' }}>تعذر تحميل التسجيلات: {loadError}<br />إن كنت لم تشغّل ملف التحديث <code>migration_status_whatsapp.sql</code> في Supabase فشغّله أولاً.</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: '#666', fontSize: '13px' }}>لا توجد تسجيلات مطابقة.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
          {filtered.map((r) => {
            const st = STATUS_META[r.status];
            const course = courseOf(r.course_title);
            const left = daysUntil(course?.start_date);
            const expanded = expandedId === r.id;
            return (
              <div key={r.id} style={{ border: '1px solid #e2e8f0', borderRight: `5px solid ${st.color}`, borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{r.student_name}</div>
                    <div style={{ color: '#8b44db', fontWeight: 'bold', fontSize: '13px' }}>{r.course_title}</div>
                  </div>
                  <span style={{ backgroundColor: st.bg, color: st.color, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{st.label}</span>
                </div>

                <div style={{ fontSize: '12px', color: '#475569', display: 'flex', flexWrap: 'wrap', gap: '4px 14px' }}>
                  <span dir="ltr">📱 {r.phone || 'لا يوجد رقم'}</span>
                  {r.training_type && <span>🎯 {r.training_type}</span>}
                  <span>🗓️ {new Date(r.created_at).toLocaleDateString('ar-EG')}</span>
                </div>

                <div style={{ fontSize: '12px', backgroundColor: '#f8fafc', borderRadius: '6px', padding: '6px 10px', color: '#475569' }}>
                  {course ? (
                    <>
                      💰 {course.fee ? `${course.fee} جنيه` : <b style={{ color: '#b45309' }}>الرسوم غير محددة</b>}
                      {' · '}
                      🚀 {course.start_date ? `${formatArabicDate(course.start_date)}${left !== null && left >= 0 ? ` (بعد ${left} يوم)` : ''}` : <b style={{ color: '#b45309' }}>الموعد غير محدد</b>}
                      {course.end_date ? ` · 🏁 ينتهي ${formatArabicDate(course.end_date)}` : ''}
                    </>
                  ) : <b style={{ color: '#b45309' }}>الكورس غير موجود في القائمة (ربما حُذف)</b>}
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>حالة المتدرب:</label>
                  <select value={r.status} onChange={(e) => changeStatus(r, e.target.value as RegStatus)} style={{ ...fieldStyle, backgroundColor: st.bg, color: st.color, fontWeight: 'bold', marginTop: '4px' }}>
                    {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                  </select>
                </div>

                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '5px' }}>📲 إرسال رسالة واتساب:</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {MESSAGE_ORDER.map((k) => {
                      const sentAt = r[MESSAGE_META[k].sentField as keyof RegistrationRow] as string | null | undefined;
                      return (
                        <button key={k} onClick={() => sendWhatsApp(r, k)} title={sentAt ? `أُرسلت: ${fmtDateTime(sentAt)}` : 'لم تُرسل بعد'} style={{
                          backgroundColor: sentAt ? '#ecfdf5' : '#fff', color: sentAt ? '#047857' : '#334155', border: `1px solid ${sentAt ? '#10b981' : '#cbd5e1'}`,
                          padding: '7px 4px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px',
                        }}>
                          {MESSAGE_META[k].icon} {MESSAGE_META[k].label} {sentAt ? '✓' : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {r.status === 'paid' && (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>المبلغ المدفوع (جنيه):</label>
                    <input type="number" min="0" defaultValue={r.paid_amount ?? ''} placeholder={course?.fee ? String(course.fee) : '0'}
                      onBlur={(e) => { const v = e.target.value === '' ? null : Number(e.target.value); if (v !== (r.paid_amount ?? null)) updateRow(r.id, { paid_amount: v }); }}
                      style={{ ...fieldStyle, marginTop: '4px' }} />
                  </div>
                )}

                <input type="text" defaultValue={r.notes ?? ''} placeholder="📝 ملاحظات (تُحفظ تلقائياً)"
                  onBlur={(e) => { if (e.target.value !== (r.notes ?? '')) updateRow(r.id, { notes: e.target.value }); }} style={fieldStyle} />

                <button onClick={() => setExpandedId(expanded ? null : r.id)} style={{ background: 'none', border: 'none', color: '#8b44db', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', textAlign: 'right', padding: 0 }}>
                  {expanded ? '▲ إخفاء البيانات الكاملة' : '▼ عرض البيانات الكاملة'}
                </button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setEditing(r)} style={{ ...btn('#2d3d52'), flex: 1 }}>✏️ تعديل البيانات</button>
                  <button onClick={() => deleteRow(r)} style={{ ...btn('#dc2626'), flex: '0 0 auto' }}>🗑️ حذف</button>
                </div>
                {expanded && (
                  <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.9, backgroundColor: '#f8fafc', borderRadius: '6px', padding: '8px 10px' }}>
                    <div>🪪 الرقم القومي: <span dir="ltr">{r.national_id || '-'}</span></div>
                    <div>📍 العنوان: {r.address || '-'}</div>
                    <div>🎓 المؤهل: {r.education || '-'}</div>
                    <div>🏢 جهة العمل: {r.workplace || '-'}</div>
                    <div>💼 الوظيفة: {r.job_title || '-'}</div>
                    <div>✉️ البريد: {r.email || '-'}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <EditRegistrationModal
        row={editing}
        courseTitles={courses.map((c) => c.title)}
        onClose={() => setEditing(null)}
        onSave={async (id, patch) => {
          const ok = await updateRow(id, patch);
          if (ok) notify('✅ تم حفظ التعديلات', 'success');
          return ok;
        }}
      />
    </div>
  );
}
