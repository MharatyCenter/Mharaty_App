import { useEffect, useState } from 'react';
import logoImg from './logo.png'; 
import { supabase } from './supabaseClient';

interface Course {
  id: number;
  title: string;
  instructor: string;
  duration: string;
  level: string;
  description: string;
  category: 'digital' | 'professional' | 'life';
  is_active: boolean;
  month_1: boolean;
  month_2: boolean;
  month_3: boolean;
}

interface ContactInfo {
  phone?: string;
  whatsapp?: string;
  facebook?: string;
  youtube?: string;
  instagram?: string;
  telegram?: string;
  email?: string;
  website?: string;
  address?: string;
  working_hours?: string;
}

interface HomeScreenProps {
  onNavigateToCategory: (category: 'digital' | 'professional' | 'life') => void;
  onNavigateToTrainer?: () => void;
  onOpenAdminLogin?: () => void;
}

function HomeScreen({ onNavigateToCategory, onNavigateToTrainer, onOpenAdminLogin }: HomeScreenProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeCourses, setActiveCourses] = useState<Course[]>([]);
  const [planCourses, setPlanCourses] = useState<Course[]>([]);

  // حالات الطي والإظهار للأقسام المطلوبة
  const [isReadyCoursesOpen, setIsReadyCoursesOpen] = useState(true);
  const [isQuarterPlanOpen, setIsQuarterPlanOpen] = useState(true);

  // حالة نافذة التواصل معنا
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);

  // حالات نموذج إرسال الاستفسار
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderMessage, setSenderMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetchData();
    fetchContactInfo();
    trackVisitor(); 
  }, []);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*');

      if (error) {
        console.error('خطأ في جلب البيانات:', error.message);
      } else {
        const allCourses = data || [];
        setActiveCourses(allCourses.filter(c => c.is_active));
        setPlanCourses(allCourses.filter(c => c.month_1 || c.month_2 || c.month_3));
      }
    } catch (err) {
      console.error('خطأ غير متوقع:', err);
    }
  };

  const fetchContactInfo = async () => {
    try {
      const { data, error } = await supabase
        .schema('mharaty')
        .from('contact_info')
        .select('*')
        .eq('id', 1)
        .single();

      if (!error && data) {
        setContactInfo(data);
      }
    } catch (err) {
      console.error('خطأ في جلب بيانات التواصل:', err);
    }
  };

  const trackVisitor = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error: fetchError } = await supabase
        .schema('mharaty')
        .from('site_analytics')
        .select('*')
        .eq('visit_date', today)
        .maybeSingle();

      if (!fetchError && data) {
        await supabase
          .schema('mharaty')
          .from('site_analytics')
          .update({ visitor_count: data.visitor_count + 1 })
          .eq('visit_date', today);
      } else {
        await supabase
          .schema('mharaty')
          .from('site_analytics')
          .insert([{ visit_date: today, visitor_count: 1 }]);
      }
    } catch (err) {
      console.error('خطأ في تتبع الزيارات:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .schema('mharaty')
        .from('contact_messages')
        .insert([{ sender_name: senderName, sender_email: senderEmail, message: senderMessage }]);

      if (error) throw error;

      setSubmitSuccess(true);
      setSenderName('');
      setSenderEmail('');
      setSenderMessage('');
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (err) {
      console.error('خطأ في إرسال الرسالة:', err);
      alert('حدث خطأ أثناء إرسال الرسالة، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ direction: 'rtl', textAlign: 'right', padding: '15px', backgroundColor: '#f4f6f8', minHeight: '100vh', position: 'relative' }}>
      
      {/* الهيدر */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2d3d52', padding: '10px 20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={logoImg} alt="Mharaty Logo" style={{ height: '38px', width: 'auto', borderRadius: '4px' }} />
          <h1 style={{ color: '#fff', margin: 0, fontSize: '18px', fontWeight: 'bold' }}>MHARATY</h1>
        </div>

        <div onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ display: 'flex', flexDirection: 'column', gap: '5px', cursor: 'pointer', padding: '5px' }}>
          <span style={{ width: '22px', height: '3px', backgroundColor: '#fff', borderRadius: '2px' }}></span>
          <span style={{ width: '22px', height: '3px', backgroundColor: '#fff', borderRadius: '2px' }}></span>
          <span style={{ width: '22px', height: '3px', backgroundColor: '#fff', borderRadius: '2px' }}></span>
        </div>
      </header>

      {/* القائمة الجانبية */}
      <div style={{
        position: 'absolute', top: '65px', left: '15px', backgroundColor: '#2d3d52', borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)', padding: '15px', display: isMenuOpen ? 'flex' : 'none',
        flexDirection: 'column', gap: '12px', zIndex: 100, minWidth: '160px', border: '1px solid #4a5d78'
      }}>
        <span onClick={() => { setIsMenuOpen(false); }} style={{ cursor: 'pointer', fontWeight: 'bold', color: '#b967ff', fontSize: '14px' }}>الرئيسية</span>
        
        <span 
          onClick={() => { 
            setIsMenuOpen(false); 
            if (onNavigateToTrainer) onNavigateToTrainer(); 
          }} 
          style={{ cursor: 'pointer', color: '#ccc', fontSize: '14px' }}
        >
          المدربين
        </span>

        <span 
          onClick={() => { 
            setIsMenuOpen(false); 
            setShowContactModal(true); 
          }} 
          style={{ cursor: 'pointer', color: '#ccc', fontSize: '14px' }}
        >
          التواصل معنا
        </span>

        <div style={{ height: '1px', backgroundColor: '#4a5d78', margin: '5px 0' }}></div>

        <span 
          onClick={() => {
            setIsMenuOpen(false);
            if (onOpenAdminLogin) onOpenAdminLogin();
          }}
          style={{ cursor: 'pointer', color: '#10b981', fontWeight: 'bold', fontSize: '14px' }}
        >
          دخول المشرفين
        </span>

        <span style={{ cursor: 'pointer', color: '#ccc', fontSize: '14px' }}>تسجيل الدخول</span>
      </div>

      <main style={{ marginTop: '20px' }}>
        
        {/* قسم الترحيب */}
        <section style={{ backgroundColor: '#2d3d52', color: '#fff', padding: '25px 20px', borderRadius: '12px', marginBottom: '30px', borderRight: '5px solid #b967ff', backgroundImage: 'linear-gradient(135deg, #2d3d52 60%, #8b44db 100%)' }}>
          <h2 style={{ fontSize: '20px', margin: '0 0 10px 0' }}>مرحباً بك في منصة مهاراتي التعليمية 👋</h2>
          <p style={{ fontSize: '14px', opacity: 0.9, margin: 0, lineHeight: '1.5' }}>طوّر مهاراتك اليوم وافتح آفاقاً جديدة لمستقبلك المهني من خلال دورات تدريبية متخصصة.</p>
        </section>

        {/* 1. كتالوج الكورسات */}
        <h2 style={{ color: '#2d3d52', fontSize: '18px', marginBottom: '15px', borderBottom: '2px solid #2d3d52', paddingBottom: '5px', width: 'fit-content' }}>📚 كتالوج الكورسات</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '15px', marginBottom: '40px' }}>
          
          <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '10px', boxShadow: '0 3px 8px rgba(0,0,0,0.04)', borderTop: '4px solid #8b44db', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: '50px', height: '50px', backgroundColor: '#f3e8ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '10px' }}>💻</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#2d3d52', fontSize: '16px' }}>مهارات رقمية</h3>
            <p style={{ color: '#666', fontSize: '13px', margin: '0 0 15px 0', minHeight: '36px', lineHeight: '1.4' }}>تشمل البرمجة، تطوير الويب (React & Supabase)، التصميم الرقمي، وتحليل البيانات.</p>
            <button onClick={() => onNavigateToCategory('digital')} style={{ width: '100%', backgroundColor: '#2d3d52', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>عرض الدورات</button>
          </div>

          <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '10px', boxShadow: '0 3px 8px rgba(0,0,0,0.04)', borderTop: '4px solid #b967ff', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: '50px', height: '50px', backgroundColor: '#fae8ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '10px' }}>👔</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#2d3d52', fontSize: '16px' }}>مهارات مهنية</h3>
            <p style={{ color: '#666', fontSize: '13px', margin: '0 0 15px 0', minHeight: '36px', lineHeight: '1.4' }}>تتضمن إدارة المشاريع، التسويق الإلكتروني، التخطيط للأعمال، ومهارات القيادة وسوق العمل.</p>
            <button onClick={() => onNavigateToCategory('professional')} style={{ width: '100%', backgroundColor: '#2d3d52', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>عرض الدورات</button>
          </div>

          <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '10px', boxShadow: '0 3px 8px rgba(0,0,0,0.04)', borderTop: '4px solid #2d3d52', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: '50px', height: '50px', backgroundColor: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '10px' }}>🌱</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#2d3d52', fontSize: '16px' }}>مهارات حياتية</h3>
            <p style={{ color: '#666', fontSize: '13px', margin: '0 0 15px 0', minHeight: '36px', lineHeight: '1.4' }}>تركز على التواصل الفعّال، إدارة الوقت، التفكير الإبداعي، والتطوير الذاتي والشخصي.</p>
            <button onClick={() => onNavigateToCategory('life')} style={{ width: '100%', backgroundColor: '#2d3d52', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>عرض الدورات</button>
          </div>

        </div>

        {/* 2. الكورسات النشطة حالياً */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '2px solid #10b981', paddingBottom: '5px', marginBottom: '15px' }}>
          <h2 style={{ color: '#2d3d52', fontSize: '18px', margin: 0 }}>⚡ الكورسات النشطة حالياً</h2>
          <button 
            onClick={() => setIsReadyCoursesOpen(!isReadyCoursesOpen)}
            style={{ backgroundColor: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
          >
            {isReadyCoursesOpen ? '▲ إخفاء' : '▼ إظهار'}
          </button>
        </div>

        {isReadyCoursesOpen && (
          activeCourses.length === 0 ? (
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '40px' }}>لا توجد كورسات نشطة حالياً.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '15px', marginBottom: '40px' }}>
              {activeCourses.map((course) => (
                <div key={course.id} style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ backgroundColor: '#10b981', color: '#fff', fontSize: '11px', padding: '3px 6px', borderRadius: '4px', position: 'absolute', top: '12px', left: '12px' }}>جاري الآن</span>
                    <h4 style={{ margin: '10px 0 8px 0', color: '#2d3d52', fontSize: '15px' }}>{course.title}</h4>
                    <p style={{ color: '#666', fontSize: '13px', margin: '0 0 15px 0', lineHeight: '1.4' }}>{course.description ? course.description.substring(0, 70) + '...' : course.instructor}</p>
                  </div>
                  <button onClick={() => onNavigateToCategory(course.category)} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', width: '100%' }}>
                    استعراض ودخول الكورس
                  </button>
                </div>
              ))}
            </div>
          )
        )}

        {/* 3. خطة الربع الحالي (3 أشهر) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '2px solid #8b44db', paddingBottom: '5px', marginBottom: '15px' }}>
          <h2 style={{ color: '#2d3d52', fontSize: '18px', margin: 0 }}>📅 خطة الربع الحالي (3 أشهر)</h2>
          <button 
            onClick={() => setIsQuarterPlanOpen(!isQuarterPlanOpen)}
            style={{ backgroundColor: 'transparent', border: 'none', color: '#8b44db', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
          >
            {isQuarterPlanOpen ? '▲ إخفاء' : '▼ إظهار'}
          </button>
        </div>

        {isQuarterPlanOpen && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '15px', marginBottom: '30px' }}>
            
            {/* الشهر الأول */}
            <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', borderRight: '5px solid #8b44db' }}>
              <h4 style={{ color: '#8b44db', margin: '0 0 12px 0', fontSize: '15px' }}>الشهر الأول</h4>
              {planCourses.filter(c => c.month_1).length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>لا توجد كورسات مضافة لهذا الشهر.</p>
              ) : (
                <ul style={{ margin: 0, paddingRight: '18px', color: '#444', fontSize: '13px', lineHeight: '1.6' }}>
                  {planCourses.filter(c => c.month_1).map(c => (
                    <li key={c.id} style={{ marginBottom: '6px' }}>
                      <span onClick={() => onNavigateToCategory(c.category)} style={{ color: '#8b44db', cursor: 'pointer', fontWeight: 'bold' }}>{c.title}</span>
                      <span style={{ color: '#666', fontSize: '11px', display: 'block' }}>المدرب: {c.instructor}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* الشهر الثاني */}
            <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', borderRight: '5px solid #b967ff' }}>
              <h4 style={{ color: '#b967ff', margin: '0 0 12px 0', fontSize: '15px' }}>الشهر الثاني</h4>
              {planCourses.filter(c => c.month_2).length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>لا توجد كورسات مضافة لهذا الشهر.</p>
              ) : (
                <ul style={{ margin: 0, paddingRight: '18px', color: '#444', fontSize: '13px', lineHeight: '1.6' }}>
                  {planCourses.filter(c => c.month_2).map(c => (
                    <li key={c.id} style={{ marginBottom: '6px' }}>
                      <span onClick={() => onNavigateToCategory(c.category)} style={{ color: '#b967ff', cursor: 'pointer', fontWeight: 'bold' }}>{c.title}</span>
                      <span style={{ color: '#666', fontSize: '11px', display: 'block' }}>المدرب: {c.instructor}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* الشهر الثالث */}
            <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', borderRight: '5px solid #2d3d52' }}>
              <h4 style={{ color: '#2d3d52', margin: '0 0 12px 0', fontSize: '15px' }}>الشهر الثالث</h4>
              {planCourses.filter(c => c.month_3).length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>لا توجد كورسات مضافة لهذا الشهر.</p>
              ) : (
                <ul style={{ margin: 0, paddingRight: '18px', color: '#444', fontSize: '13px', lineHeight: '1.6' }}>
                  {planCourses.filter(c => c.month_3).map(c => (
                    <li key={c.id} style={{ marginBottom: '6px' }}>
                      <span onClick={() => onNavigateToCategory(c.category)} style={{ color: '#2d3d52', cursor: 'pointer', fontWeight: 'bold' }}>{c.title}</span>
                      <span style={{ color: '#666', fontSize: '11px', display: 'block' }}>المدرب: {c.instructor}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </div>
        )}

      </main>

      {/* نافذة التواصل معنا والنموذج التفاعلي */}
      {showContactModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '15px' }}>
          <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '16px', width: '100%', maxWidth: '480px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', border: '1px solid #e2e8f0', direction: 'rtl', textAlign: 'right', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #b967ff', paddingBottom: '10px', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#2d3d52', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📞 تواصل معنا والاستفسار
              </h3>
              <button 
                onClick={() => setShowContactModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            {/* بطاقة معلومات التواصل مع صورة مصغرة للخريطة */}
            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', marginBottom: '15px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
              {contactInfo?.phone && <div><strong>الهاتف:</strong> <span style={{ color: '#334155' }}>{contactInfo.phone}</span></div>}
              {contactInfo?.whatsapp && <div><strong>واتساب:</strong> <span style={{ color: '#10b981' }}>{contactInfo.whatsapp}</span></div>}
              {contactInfo?.email && <div style={{ gridColumn: 'span 2' }}><strong>البريد الإلكتروني:</strong> <span style={{ color: '#334155' }}>{contactInfo.email}</span></div>}
              
              <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '4px' }}>
                {/* صورة مصغرة تمثل الخريطة بموقع المركز (يمكن استبدال رابط الخلفية برابط صورة حقيقية لخريطة المكان إذا توفرت) */}
                <a 
                  href="https://maps.app.goo.gl/DKzBLUZ8ZjKCYTYT9?g_st=awb" 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ 
                    display: 'block', width: '75px', height: '55px', borderRadius: '6px', overflow: 'hidden', 
                    border: '2px solid #cbd5e1', flexShrink: 0, position: 'relative',
                    textDecoration: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  title="اضغط لفتح الخريطة بحجم كامل"
                >
                  <div style={{ 
                    width: '100%', height: '100%', 
                    backgroundImage: 'url("https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=150&q=80")', 
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
                  }}>
                    {/* علامة دبوس الموقع (Pin) في منتصف الصورة المصغرة */}
                    <span style={{ fontSize: '18px', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))' }}>📍</span>
                  </div>
                </a>

                <div>
                  <strong>العنوان:</strong> <span style={{ color: '#334155' }}>{contactInfo?.address || 'أسوان - الشيخ هارون - بجوار مرور أسوان'}</span>
                  <div style={{ marginTop: '4px' }}>
                    <a 
                      href="https://maps.app.goo.gl/DKzBLUZ8ZjKCYTYT9?g_st=awb" 
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ color: '#8b44db', textDecoration: 'underline', fontSize: '12px', fontWeight: 'bold' }}
                    >
                      🗺️ اضغط على الخريطة لعرض الموقع بوضوح
                    </a>
                  </div>
                </div>
              </div>

              {contactInfo?.working_hours && <div style={{ gridColumn: 'span 2', marginTop: '4px' }}><strong>ساعات العمل:</strong> <span style={{ color: '#334155' }}>{contactInfo.working_hours}</span></div>}
            </div>

            {/* أيقونات السوشيال ميديا */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
              {contactInfo?.facebook && <a href={contactInfo.facebook} target="_blank" rel="noreferrer" style={{ backgroundColor: '#e7f3ff', color: '#1877f2', padding: '5px 12px', borderRadius: '15px', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold' }}>فيسبوك</a>}
              {contactInfo?.youtube && <a href={contactInfo.youtube} target="_blank" rel="noreferrer" style={{ backgroundColor: '#ffebee', color: '#ff0000', padding: '5px 12px', borderRadius: '15px', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold' }}>يوتيوب</a>}
              {contactInfo?.instagram && <a href={contactInfo.instagram} target="_blank" rel="noreferrer" style={{ backgroundColor: '#fce4ec', color: '#e1306c', padding: '5px 12px', borderRadius: '15px', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold' }}>إنستغرام</a>}
              {contactInfo?.telegram && <a href={contactInfo.telegram} target="_blank" rel="noreferrer" style={{ backgroundColor: '#e3f2fd', color: '#0088cc', padding: '5px 12px', borderRadius: '15px', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold' }}>تيليجرام</a>}
            </div>

            {/* نموذج إرسال استفسار */}
            <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
              <h4 style={{ margin: '0 0 5px 0', color: '#2d3d52', fontSize: '14px' }}>💬 أرسل استفسارك مباشرة</h4>
              
              {submitSuccess && (
                <div style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '8px', borderRadius: '6px', fontSize: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                  ✨ تم إرسال استفسارك بنجاح، سنتواصل معك قريباً!
                </div>
              )}

              <input 
                type="text" 
                placeholder="اسمك الكريم..." 
                value={senderName} 
                onChange={(e) => setSenderName(e.target.value)} 
                required 
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
              />

              <input 
                type="email" 
                placeholder="البريد الإلكتروني..." 
                value={senderEmail} 
                onChange={(e) => setSenderEmail(e.target.value)} 
                required 
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
              />

              <textarea 
                placeholder="اكتب استفسارك أو رسالتك هنا..." 
                value={senderMessage} 
                onChange={(e) => setSenderMessage(e.target.value)} 
                rows={2} 
                required 
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', resize: 'vertical' }}
              ></textarea>

              <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  style={{ flex: 1, backgroundColor: '#8b44db', color: '#fff', border: 'none', padding: '9px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                >
                  {isSubmitting ? 'جاري الإرسال...' : 'إرسال الاستفسار'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowContactModal(false)} 
                  style={{ backgroundColor: '#e2e8f0', color: '#334155', border: 'none', padding: '9px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                >
                  إغلاق
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

export default HomeScreen;