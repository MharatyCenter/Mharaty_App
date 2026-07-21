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

interface HomeScreenProps {
  onNavigateToCategory: (category: 'digital' | 'professional' | 'life') => void;
  onNavigateToTrainer?: () => void;
  onOpenAdminLogin?: () => void; // 👈 إضافة خاصية فتح نافذة دخول المشرفين
}

function HomeScreen({ onNavigateToCategory, onNavigateToTrainer, onOpenAdminLogin }: HomeScreenProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeCourses, setActiveCourses] = useState<Course[]>([]);
  const [planCourses, setPlanCourses] = useState<Course[]>([]);

  // حالات الطي والإظهار للأقسام المطلوبة
  const [isReadyCoursesOpen, setIsReadyCoursesOpen] = useState(true);
  const [isQuarterPlanOpen, setIsQuarterPlanOpen] = useState(true);

  useEffect(() => {
    fetchData();
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

      {/* القائمة الجانبية (مفعلة بالكامل) */}
      <div style={{
        position: 'absolute', top: '65px', left: '15px', backgroundColor: '#2d3d52', borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)', padding: '15px', display: isMenuOpen ? 'flex' : 'none',
        flexDirection: 'column', gap: '12px', zIndex: 100, minWidth: '160px', border: '1px solid #4a5d78'
      }}>
        <span onClick={() => { setIsMenuOpen(false); }} style={{ cursor: 'pointer', fontWeight: 'bold', color: '#b967ff', fontSize: '14px' }}>الرئيسية</span>
        
        {/* رابط المدربين المفعل */}
        <span 
          onClick={() => { 
            setIsMenuOpen(false); 
            if (onNavigateToTrainer) onNavigateToTrainer(); 
          }} 
          style={{ cursor: 'pointer', color: '#ccc', fontSize: '14px' }}
        >
          المدربين
        </span>

        <span style={{ cursor: 'pointer', color: '#ccc', fontSize: '14px' }}>التواصل معنا</span>

        <div style={{ height: '1px', backgroundColor: '#4a5d78', margin: '5px 0' }}></div>

        {/* 🔐 رابط دخول المشرفين الجديد داخل القائمة */}
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
    </div>
  );
}

export default HomeScreen;