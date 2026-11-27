import { trackPixel } from './lib/pixel';
import React, { useEffect, useRef, useState } from 'react';
import { supabase } from './supabaseClient';
import { useToast } from './ui/Toast';
import { useBackClose } from './ui/useBackClose';
import PrivacyPolicy from './ui/PrivacyPolicy';
import { centerWhatsAppLink } from './lib/center';
import { useIsMobile } from './ui/useIsMobile';
import { sendRegistrationToSheet } from './lib/sheets';
import { formatArabicDate } from './lib/messages';
import { isValidEmail, isValidName, isValidNationalId, isValidPhone, newId, normalizeDigits, normalizePhone } from './lib/validation';

interface Course {
  id: number;
  title: string;
  description: string;
  category: 'digital' | 'professional' | 'life';
  duration: string;
  instructor: string;
  level: string;
  fee?: number | null;
  start_date?: string | null;
  schedule?: string | null;
}

interface CoursesScreenProps {
  currentCategory: 'digital' | 'professional' | 'life';
  onBack: () => void;
}

const REMEMBER_KEY = 'mharaty_student';

interface RegisterForm {
  name: string;
  nationalId: string;
  phone: string; // رقم الواتساب
  email: string;
  address: string;
  trainingType: '' | 'online' | 'offline';
  education: string;
  workplace: string;
  job: string;
}
type FormErrors = Partial<Record<keyof RegisterForm, string>>;

const EMPTY_FORM: RegisterForm = { name: '', nationalId: '', phone: '', email: '', address: '', trainingType: '', education: '', workplace: '', job: '' };
const EDUCATION_OPTIONS = ['مؤهل متوسط', 'دبلوم', 'بكالوريوس / ليسانس', 'دراسات عليا (ماجستير / دكتوراه)', 'أخرى'];

export default function CoursesScreen({ currentCategory, onBack }: CoursesScreenProps) {
  const toast = useToast();
  const isMobile = useIsMobile();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const submitLock = useRef(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [form, setForm] = useState<RegisterForm>(EMPTY_FORM);
  const setField = <K extends keyof RegisterForm>(key: K, value: RegisterForm[K]) => setForm((f) => ({ ...f, [key]: value }));

  // حالة لتحديد الكورس المراد عرض تفاصيله
  const [selectedCourseDetails, setSelectedCourseDetails] = useState<Course | null>(null);

  // حالات نافذة تسجيل المتدرب (Modal)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedCourseForRegister, setSelectedCourseForRegister] = useState<Course | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consent, setConsent] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [success, setSuccess] = useState<{ name: string; course: string } | null>(null);

  // زر الرجوع يغلق الطبقة العليا (النافذة ثم شاشة التفاصيل) بدل الخروج من التطبيق
  useBackClose(!!selectedCourseDetails, () => setSelectedCourseDetails(null));
  useBackClose(isRegisterModalOpen, () => { if (!submitLock.current) setIsRegisterModalOpen(false); });

  const categoryTitles = {
    digital: 'كورسات التخصص الرقمي',
    professional: 'كورسات التخصص المهني',
    life: 'كورسات مهارات الحياة'
  };

  useEffect(() => {
    fetchCourses();
    setSelectedCourseDetails(null);
  }, [currentCategory]);

  const fetchCourses = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const { data, error } = await supabase
        .schema('mharaty')
        .from('courses')
        .select('*')
        .eq('category', currentCategory);

      if (error) {
        console.error('خطأ في جلب الكورسات:', error.message);
        setCourses([]);
        setLoadError(true);
      } else {
        setCourses(data || []);
      }
    } catch (err) {
      console.error('خطأ غير متوقع:', err);
      setCourses([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRegister = (course: Course, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedCourseForRegister(course);
    let saved: Partial<RegisterForm> = {};
    try { saved = JSON.parse(localStorage.getItem(REMEMBER_KEY) || '{}'); } catch { /* ignore */ }
    // لا نحفظ الرقم القومي على الجهاز لأنه بيان حساس
    setForm({ ...EMPTY_FORM, ...saved, nationalId: '', trainingType: '' });
    setFormErrors({});
    setConsent(false);
    setIsRegisterModalOpen(true);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLock.current || !selectedCourseForRegister) return;

    const errors: FormErrors = {};
    if (!isValidName(form.name)) errors.name = 'يرجى إدخال الاسم الكامل (3 أحرف على الأقل).';
    if (!isValidNationalId(form.nationalId)) errors.nationalId = 'الرقم القومي غير صحيح (14 رقماً).';
    if (!isValidPhone(form.phone)) errors.phone = 'رقم الواتساب غير صحيح (مثال: 01012345678).';
    if (form.email.trim() && !isValidEmail(form.email)) errors.email = 'البريد الإلكتروني غير صحيح.';
    if (form.address.trim().length < 5) errors.address = 'يرجى كتابة العنوان بالتفصيل.';
    if (!form.trainingType) errors.trainingType = 'اختر نوع التدريب.';
    if (!form.education) errors.education = 'اختر المؤهل الدراسي.';
    if (!consent) toast.error('يلزم الموافقة على سياسة الخصوصية لإتمام التسجيل.');
    setFormErrors(errors);
    if (!consent || Object.keys(errors).length > 0) {
      if (consent) toast.error('يرجى مراجعة الحقول المظللة بالأحمر.');
      return;
    }

    if (!navigator.onLine) {
      toast.error('لا يوجد اتصال بالإنترنت. حاول مرة أخرى عند عودة الاتصال.');
      return;
    }

    submitLock.current = true;
    setIsSubmitting(true);

    const record = {
      id: newId(),
      course_title: selectedCourseForRegister.title,
      student_name: form.name.trim(),
      national_id: normalizeDigits(form.nationalId),
      phone: normalizePhone(form.phone),
      email: form.email.trim().toLowerCase(),
      address: form.address.trim(),
      training_type: form.trainingType === 'online' ? 'أونلاين' : 'أوفلاين',
      education: form.education,
      workplace: form.workplace.trim(),
      job_title: form.job.trim(),
    };

    try {
      // 1) الحفظ في Supabase أولاً: قاعدة البيانات هي التي تمنع التسجيل المكرر (نفس الرقم القومي + نفس الكورس)
      const { id: clientId, ...rest } = record;
      const dbRow = { ...rest, client_id: clientId };
      const dbResult = await supabase.schema('mharaty').from('course_registrations').insert([dbRow]);
      if (dbResult.error?.code === '23505') {
        setFormErrors({ nationalId: 'هذا الرقم القومي مسجَّل بالفعل في هذا الكورس.' });
        toast.error('أنت مسجَّل بالفعل في هذا الكورس، وسنتواصل معك قريباً. لا حاجة للتسجيل مرة أخرى.');
        return;
      }
      const dbOk = !dbResult.error;
      if (!dbOk) console.error('خطأ Supabase:', dbResult.error?.message);
      // 2) الإرسال إلى Google Sheet (يعمل كنسخة احتياطية إن تعذر الحفظ في Supabase)
      const sheetSent = await sendRegistrationToSheet(record);

      if (dbOk || sheetSent) {
        trackPixel('Lead', { content_name: record.course_title });
        try {
          const { nationalId: _n, trainingType: _t, ...toRemember } = form;
          void _n; void _t;
          localStorage.setItem(REMEMBER_KEY, JSON.stringify(toRemember));
          localStorage.setItem('mharaty_user_name', record.student_name);
        } catch { /* التخزين المحلي غير متاح */ }
        setIsRegisterModalOpen(false);
        setSuccess({ name: record.student_name, course: record.course_title });
      } else {
        toast.error('تعذر إتمام التسجيل حالياً. تحقق من الاتصال وحاول مرة أخرى.');
      }
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ غير متوقع. حاول مرة أخرى.');
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  };

  // مكون نافذة التسجيل المشترك لمنع تكرار الكود
  const renderRegisterModal = () => {
    if (!isRegisterModalOpen) return null;

    const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#334155' };
    const inputBase = (key: keyof RegisterForm, ltr = false): React.CSSProperties => ({
      width: '100%', padding: '9px', borderRadius: '6px', border: `1px solid ${formErrors[key] ? '#ef4444' : '#cbd5e1'}`, fontSize: '14px', outline: 'none',
      ...(ltr ? { direction: 'ltr', textAlign: 'right' } : {}),
    });
    const errorText = (key: keyof RegisterForm) =>
      formErrors[key] ? <small style={{ color: '#dc2626', display: 'block', marginTop: '4px' }}>{formErrors[key]}</small> : null;
    const textField = (
      label: string,
      key: 'name' | 'nationalId' | 'phone' | 'email' | 'address' | 'workplace' | 'job',
      opts: { placeholder?: string; type?: string; inputMode?: 'text' | 'numeric' | 'tel' | 'email'; autoComplete?: string; maxLength?: number; ltr?: boolean },
    ) => (
      <div>
        <label style={labelStyle}>{label}</label>
        <input
          type={opts.type || 'text'}
          value={form[key]}
          onChange={(e) => setField(key, e.target.value)}
          placeholder={opts.placeholder}
          inputMode={opts.inputMode}
          autoComplete={opts.autoComplete}
          maxLength={opts.maxLength}
          aria-invalid={!!formErrors[key]}
          style={inputBase(key, opts.ltr)}
        />
        {errorText(key)}
      </div>
    );

    return (
      <div onClick={() => !isSubmitting && setIsRegisterModalOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '15px' }}>
        <div role="dialog" aria-modal="true" aria-label="التسجيل في الكورس" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '12px', width: '100%', maxWidth: '420px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', border: '2px solid #8b44db', textAlign: 'right', direction: 'rtl' }}>
          <h3 style={{ marginTop: 0, color: '#2d3d52', marginBottom: '5px' }}>📝 التسجيل في الكورس</h3>
          <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>{selectedCourseForRegister?.title}</p>
          
          <form onSubmit={handleRegisterSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {textField('الاسم الكامل (كما في البطاقة):', 'name', { placeholder: 'أدخل اسمك الرباعي...', autoComplete: 'name' })}
            {textField('الرقم القومي:', 'nationalId', { placeholder: '14 رقماً', inputMode: 'numeric', maxLength: 14, ltr: true, autoComplete: 'off' })}
            {textField('رقم الواتساب:', 'phone', { placeholder: '010xxxxxxxx', type: 'tel', inputMode: 'tel', autoComplete: 'tel', ltr: true })}
            {textField('البريد الإلكتروني (اختياري):', 'email', { placeholder: 'name@example.com', type: 'email', inputMode: 'email', autoComplete: 'email', ltr: true })}
            {textField('العنوان:', 'address', { placeholder: 'المحافظة - المدينة - الشارع...', autoComplete: 'street-address' })}

            <div>
              <label style={labelStyle}>نوع التدريب:</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {([['online', '💻 أونلاين'], ['offline', '🏢 أوفلاين (حضوري)']] as const).map(([val, text]) => (
                  <label key={val} style={{ flex: 1, textAlign: 'center', padding: '9px 6px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', border: `1px solid ${form.trainingType === val ? '#8b44db' : formErrors.trainingType ? '#ef4444' : '#cbd5e1'}`, backgroundColor: form.trainingType === val ? '#f3e8ff' : '#fff', color: form.trainingType === val ? '#8b44db' : '#475569' }}>
                    <input type="radio" name="trainingType" value={val} checked={form.trainingType === val} onChange={() => setField('trainingType', val)} style={{ display: 'none' }} />
                    {text}
                  </label>
                ))}
              </div>
              {errorText('trainingType')}
            </div>

            <div>
              <label style={labelStyle}>المؤهل الدراسي:</label>
              <select value={form.education} onChange={(e) => setField('education', e.target.value)} aria-invalid={!!formErrors.education} style={{ ...inputBase('education'), backgroundColor: '#fff' }}>
                <option value="">اختر المؤهل...</option>
                {EDUCATION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              {errorText('education')}
            </div>

            {textField('جهة العمل (اختياري):', 'workplace', { placeholder: 'اتركه فارغاً إن لم تكن تعمل', autoComplete: 'organization' })}
            {textField('الوظيفة (اختياري):', 'job', { placeholder: 'المسمى الوظيفي', autoComplete: 'organization-title' })}

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#334155', cursor: 'pointer', lineHeight: 1.7 }}>
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 6, width: 18, height: 18, flexShrink: 0 }} />
              <span>
                أوافق على جمع بياناتي واستخدامها لإدارة التسجيل والتواصل معي، وقد قرأت{' '}
                <button type="button" onClick={() => setShowPrivacy(true)} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--mh-primary)', textDecoration: 'underline', cursor: 'pointer', fontSize: 13, fontWeight: 'bold' }}>سياسة الخصوصية</button>.
              </span>
            </label>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button 
                type="submit" 
                disabled={isSubmitting}
                style={{ backgroundColor: '#8b44db', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', opacity: isSubmitting ? 0.7 : 1 }}
              >
                {isSubmitting ? 'جاري الحفظ...' : 'تأكيد التسجيل'}
              </button>
              <button 
                type="button" 
                onClick={() => setIsRegisterModalOpen(false)} 
                disabled={isSubmitting}
                style={{ backgroundColor: '#64748b', color: '#fff', border: 'none', padding: '9px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderSuccess = () => {
    if (!success) return null;
    const wa = centerWhatsAppLink(`مرحباً، أنا ${success.name} وقد سجّلت في كورس «${success.course}». أود تأكيد الحجز.`);
    return (
      <div onClick={() => setSuccess(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: 15 }}>
        <div role="dialog" aria-modal="true" aria-label="تم التسجيل" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: '28px 22px', width: '100%', maxWidth: 380, textAlign: 'center', direction: 'rtl' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', color: 'var(--mh-success)', fontSize: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>✓</div>
          <h3 style={{ margin: '0 0 6px', color: 'var(--mh-navy)' }}>تم تسجيلك بنجاح</h3>
          <p style={{ margin: '0 0 4px', color: '#475569', fontSize: 14 }}>أهلاً {success.name}</p>
          <p style={{ margin: '0 0 18px', color: 'var(--mh-muted)', fontSize: 13, lineHeight: 1.8 }}>تم استلام تسجيلك في «{success.course}». سنتواصل معك عبر الواتساب لتأكيد الحجز وتفاصيل السداد.</p>
          {wa && <a href={wa} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: '#25d366', color: '#fff', padding: 12, borderRadius: 10, fontWeight: 'bold', textDecoration: 'none', marginBottom: 10 }}>💬 تواصل معنا على واتساب</a>}
          <button onClick={() => setSuccess(null)} style={{ width: '100%', background: 'var(--mh-navy)', color: '#fff', border: 'none', padding: 12, borderRadius: 10, fontWeight: 'bold', cursor: 'pointer', fontSize: 15 }}>حسناً</button>
        </div>
      </div>
    );
  };

  // 1. شاشة تفاصيل الكورس
  if (selectedCourseDetails) {
    return (
      <div style={{ direction: 'rtl', textAlign: 'right', padding: '20px', backgroundColor: '#f4f6f8', minHeight: '100vh', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '25px', backgroundColor: '#2d3d52', padding: '15px 20px', borderRadius: '10px', color: '#fff' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>📖 تفاصيل الكورس التدريبي</h2>
          <button 
            onClick={() => setSelectedCourseDetails(null)} 
            style={{ backgroundColor: '#8b44db', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}
          >
            ← العودة لقائمة الكورسات
          </button>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '10px', boxShadow: '0 3px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <span style={{ backgroundColor: '#f3e8ff', color: '#8b44db', padding: '6px 15px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>⏳ المدة: {selectedCourseDetails.duration || 'غير محدد'}</span>
            <span style={{ backgroundColor: '#e2e8f0', color: '#334155', padding: '6px 15px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>📊 المستوى: {selectedCourseDetails.level || 'غير محدد'}</span>
          </div>

          <h1 style={{ color: '#2d3d52', marginTop: 0, marginBottom: '15px' }}>{selectedCourseDetails.title}</h1>
          <p style={{ color: '#475569', fontSize: '15px', marginBottom: '25px' }}>👨‍🏫 المدرب المسؤول: <strong>{selectedCourseDetails.instructor || 'غير محدد'}</strong></p>

          {(selectedCourseDetails.fee || selectedCourseDetails.start_date || selectedCourseDetails.schedule) && (
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 15px', marginBottom: '25px', color: '#334155', fontSize: '14px', lineHeight: 2 }}>
              {selectedCourseDetails.fee ? <div>💰 الرسوم: <strong>{selectedCourseDetails.fee} جنيه</strong></div> : null}
              {selectedCourseDetails.start_date ? <div>🚀 موعد البدء: <strong>{formatArabicDate(selectedCourseDetails.start_date)}</strong></div> : null}
              {selectedCourseDetails.schedule ? <div>🕐 المواعيد: <strong>{selectedCourseDetails.schedule}</strong></div> : null}
            </div>
          )}

          <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '20px 0' }} />

          <h3 style={{ color: '#2d3d52', fontSize: '18px' }}>وصف الكورس ومحاوره:</h3>
          <p style={{ color: '#555', fontSize: '16px', lineHeight: '1.8', marginBottom: '30px' }}>{selectedCourseDetails.description}</p>

          <button 
            onClick={(e) => handleOpenRegister(selectedCourseDetails, e)}
            style={{ backgroundColor: '#8b44db', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
          >
            📝 سجل الآن في هذا الكورس
          </button>
        </div>

        {renderRegisterModal()}
        {renderSuccess()}
        <PrivacyPolicy open={showPrivacy} onClose={() => setShowPrivacy(false)} />
      </div>
    );
  }

  // 2. الشاشة الرئيسية لجدول الكورسات
  return (
    <div style={{ direction: 'rtl', textAlign: 'right', padding: '20px', backgroundColor: '#f4f6f8', minHeight: '100vh', position: 'relative' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '30px', backgroundColor: '#2d3d52', padding: '15px 20px', borderRadius: '10px', color: '#fff' }}>
        <h2 style={{ margin: 0, fontSize: '20px' }}>📚 {categoryTitles[currentCategory]}</h2>
        <button 
          onClick={onBack} 
          style={{ backgroundColor: '#8b44db', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}
        >
          ← العودة للرئيسية
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#666', fontSize: '16px', marginTop: '50px' }}>
          <div style={{ width: '34px', height: '34px', margin: '0 auto 12px', border: '4px solid #e9d5ff', borderTopColor: '#8b44db', borderRadius: '50%', animation: 'mh-spin 0.8s linear infinite' }} />
          جاري تحميل الكورسات...
        </div>
      ) : loadError ? (
        <div style={{ textAlign: 'center', marginTop: '60px', color: '#666' }}>
          <p style={{ fontSize: '16px' }}>تعذر تحميل الكورسات. تحقق من اتصالك بالإنترنت.</p>
          <button onClick={fetchCourses} style={{ backgroundColor: '#8b44db', color: '#fff', border: 'none', padding: '9px 22px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>إعادة المحاولة</button>
        </div>
      ) : courses.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '80px', color: '#666' }}>
          <p style={{ fontSize: '16px' }}>لا توجد كورسات مضافة في هذا التخصص حالياً.</p>
        </div>
      ) : isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {courses.map((course) => (
            <div key={course.id} style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '10px', boxShadow: '0 3px 10px rgba(0,0,0,0.06)', borderRight: '5px solid #8b44db' }}>
              <h3
                onClick={() => setSelectedCourseDetails(course)}
                style={{ margin: '0 0 8px 0', color: '#8b44db', fontSize: '16px', cursor: 'pointer' }}
              >
                {course.title}
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '20px' }}>👨‍🏫 {course.instructor || 'غير محدد'}</span>
                <span style={{ backgroundColor: '#f3e8ff', color: '#8b44db', padding: '4px 10px', borderRadius: '20px' }}>⏳ {course.duration || 'غير محدد'}</span>
                <span style={{ backgroundColor: '#e0f2fe', color: '#0284c7', padding: '4px 10px', borderRadius: '20px' }}>📊 {course.level || 'غير محدد'}</span>
                {course.fee ? <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '20px' }}>💰 {course.fee} جنيه</span> : null}
                {course.start_date ? <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '20px' }}>🚀 يبدأ {formatArabicDate(course.start_date)}</span> : null}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={(e) => handleOpenRegister(course, e)} style={{ flex: 1, backgroundColor: '#8b44db', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>سجل الآن</button>
                <button onClick={() => setSelectedCourseDetails(course)} style={{ backgroundColor: '#e2e8f0', color: '#334155', border: 'none', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>التفاصيل</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ overflowX: 'auto', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 3px 10px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ backgroundColor: '#2d3d52', color: '#fff', fontSize: '14px' }}>
                <th style={{ padding: '12px 15px' }}>اسم الكورس</th>
                <th style={{ padding: '12px 15px' }}>المدرب</th>
                <th style={{ padding: '12px 15px' }}>المدة</th>
                <th style={{ padding: '12px 15px' }}>المستوى</th>
                <th style={{ padding: '12px 15px' }}>الرسوم</th>
                <th style={{ padding: '12px 15px' }}>موعد البدء</th>
                <th style={{ padding: '12px 15px', textAlign: 'center' }}>الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course, index) => (
                <tr key={course.id} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '14px 15px' }}>
                    <span 
                      onClick={() => setSelectedCourseDetails(course)} 
                      style={{ fontWeight: 'bold', color: '#8b44db', cursor: 'pointer', textDecoration: 'underline', fontSize: '15px' }}
                      title="اضغط لعرض تفاصيل الكورس"
                    >
                      {course.title}
                    </span>
                  </td>
                  <td style={{ padding: '14px 15px', color: '#475569' }}>{course.instructor || 'غير محدد'}</td>
                  <td style={{ padding: '14px 15px', color: '#666' }}>{course.duration || 'غير محدد'}</td>
                  <td style={{ padding: '14px 15px', color: '#0284c7', fontWeight: 'bold' }}>{course.level || 'غير محدد'}</td>
                  <td style={{ padding: '14px 15px', color: '#15803d', fontWeight: 'bold' }}>{course.fee ? `${course.fee} جنيه` : '—'}</td>
                  <td style={{ padding: '14px 15px', color: '#b45309' }}>{course.start_date ? formatArabicDate(course.start_date) : '—'}</td>
                  <td style={{ padding: '14px 15px', textAlign: 'center' }}>
                    <button 
                      onClick={(e) => handleOpenRegister(course, e)}
                      style={{ backgroundColor: '#8b44db', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                    >
                      سجل الآن
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {renderRegisterModal()}
      {renderSuccess()}
      <PrivacyPolicy open={showPrivacy} onClose={() => setShowPrivacy(false)} />

    </div>
  );
}