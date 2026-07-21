import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

interface Course {
  id: number;
  title: string;
  description: string;
  category: 'digital' | 'professional' | 'life';
  duration: string;
  instructor: string;
  price?: string;
}

interface CoursesScreenProps {
  currentCategory: 'digital' | 'professional' | 'life';
  onBack: () => void;
}

export default function CoursesScreen({ currentCategory, onBack }: CoursesScreenProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // حالة لتحديد الكورس المراد عرض تفاصيله
  const [selectedCourseDetails, setSelectedCourseDetails] = useState<Course | null>(null);

  // حالات نافذة تسجيل المتدرب (Modal)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedCourseForRegister, setSelectedCourseForRegister] = useState<Course | null>(null);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    try {
      const { data, error } = await supabase
        .schema('mharaty')
        .from('courses')
        .select('*')
        .eq('category', currentCategory);

      if (error) {
        console.error('خطأ في جلب الكورسات:', error.message);
        setCourses(getDefaultCourses(currentCategory));
      } else {
        setCourses(data && data.length > 0 ? data : getDefaultCourses(currentCategory));
      }
    } catch (err) {
      console.error('خطأ غير متوقع:', err);
      setCourses(getDefaultCourses(currentCategory));
    } finally {
      setLoading(false);
    }
  };

  const getDefaultCourses = (category: 'digital' | 'professional' | 'life'): Course[] => {
    const allCourses: Record<'digital' | 'professional' | 'life', Course[]> = {
      digital: [
        { id: 1, title: 'أساسيات التسويق الرقمي', description: 'تعلم كيف تبدأ في عالم التسويق الإلكتروني وإدارة الحملات الإعلانية بكفاءة عالية، وكيفية استهداف الجمهور الصحيح لتحقيق أفضل النتائج التجارية.', category: 'digital', duration: '4 أسابيع', instructor: 'أحمد علي', price: 'مجاني' },
        { id: 2, title: 'التجارة الإلكترونية وبناء المتاجر', description: 'دورة شاملة لإنشاء وإدارة متجرك الإلكتروني من الصفر حتى احتراف البيع وتحقيق مبيعات مستدامة.', category: 'digital', duration: '6 أسابيع', instructor: 'محمد محمود', price: 'مجاني' },
      ],
      professional: [
        { id: 3, title: 'مهارات القيادة وإدارة الإدارات', description: 'اكتسب مهارات القائد الناجح في قيادة فرق العمل، توزيع المهام، وحل المشكلات بحكمة واحترافية.', category: 'professional', duration: '3 أسابيع', instructor: 'سارة خالد', price: 'مجاني' },
        { id: 4, title: 'إدارة الوقت واكتساب الإنتاجية', description: 'طرق عملية ومجربة لتنظيم المهام اليومية، التخلص من التسويف، ومضاعفة إنتاجيتك في العمل والحياة.', category: 'professional', duration: 'أسبوعان', instructor: 'محمود حسن', price: 'مجاني' },
      ],
      life: [
        { id: 5, title: 'فن التواصل الفعال ولغة الجسد', description: 'كيف تؤثر في الآخرين، تبني علاقات اجتماعية ومهنية قوية، وتقرأ لغة الجسد لمن حولك بدقة.', category: 'life', duration: 'أسبوعان', instructor: 'منى أحمد', price: 'مجاني' },
        { id: 6, title: 'التفكير الإيجابي وإدارة الضغوط', description: 'تقنيات نفسية وعملية للتخلص من التوتر، مواجهة ضغوط الحياة اليومية، ورفع جودة حياتك الشخصية.', category: 'life', duration: '3 أسابيع', instructor: 'خالد عبد الله', price: 'مجاني' },
      ]
    };
    return allCourses[category] || [];
  };

  const handleOpenRegister = (course: Course, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedCourseForRegister(course);
    setStudentName('');
    setStudentEmail('');
    setStudentPhone('');
    setIsRegisterModalOpen(true);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !studentEmail || !studentPhone) {
      alert('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .schema('mharaty')
        .from('course_registrations')
        .insert([
          {
            course_title: selectedCourseForRegister?.title,
            student_name: studentName,
            email: studentEmail,
            phone: studentPhone
          }
        ]);

      if (error) {
        alert('حدث خطأ أثناء التسجيل: ' + error.message);
      } else {
        alert('🎉 تم تسجيل طلبك بنجاح في الكورس! سنتواصل معك قريباً.');
        setIsRegisterModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ غير متوقع.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. شاشة تفاصيل الكورس (تظهر عند الضغط على اسم الكورس)
  if (selectedCourseDetails) {
    return (
      <div style={{ direction: 'rtl', textAlign: 'right', padding: '20px', backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', backgroundColor: '#2d3d52', padding: '15px 20px', borderRadius: '10px', color: '#fff' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>📖 تفاصيل الكورس التدريبي</h2>
          <button 
            onClick={() => setSelectedCourseDetails(null)} 
            style={{ backgroundColor: '#8b44db', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ← العودة لقائمة الكورسات
          </button>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '10px', boxShadow: '0 3px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <span style={{ backgroundColor: '#f3e8ff', color: '#8b44db', padding: '6px 15px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>⏳ المدة: {selectedCourseDetails.duration || 'غير محدد'}</span>
            <span style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '6px 15px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>💰 السعر: {selectedCourseDetails.price || 'مجاني'}</span>
          </div>

          <h1 style={{ color: '#2d3d52', marginTop: 0, marginBottom: '15px' }}>{selectedCourseDetails.title}</h1>
          <p style={{ color: '#475569', fontSize: '15px', marginBottom: '25px' }}>👨‍🏫 المدرب المسؤول: <strong>{selectedCourseDetails.instructor || 'غير محدد'}</strong></p>

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
      </div>
    );
  }

  // 2. الشاشة الرئيسية لجدول الكورسات
  return (
    <div style={{ direction: 'rtl', textAlign: 'right', padding: '20px', backgroundColor: '#f4f6f8', minHeight: '100vh', position: 'relative' }}>
      
      {/* الهيدر العلوي */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', backgroundColor: '#2d3d52', padding: '15px 20px', borderRadius: '10px', color: '#fff' }}>
        <h2 style={{ margin: 0, fontSize: '20px' }}>📚 {categoryTitles[currentCategory]}</h2>
        <button 
          onClick={onBack} 
          style={{ backgroundColor: '#8b44db', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          ← العودة للرئيسية
        </button>
      </div>

      {/* محتوى الكورسات */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#666', fontSize: '16px', marginTop: '50px' }}>جاري تحميل الكورسات... 🔄</p>
      ) : courses.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '80px', color: '#666' }}>
          <p style={{ fontSize: '16px' }}>لا توجد كورسات مضافة في هذا التخصص حالياً.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 3px 10px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ backgroundColor: '#2d3d52', color: '#fff', fontSize: '14px' }}>
                <th style={{ padding: '12px 15px' }}>اسم الكورس</th>
                <th style={{ padding: '12px 15px' }}>المدرب</th>
                <th style={{ padding: '12px 15px' }}>المدة</th>
                <th style={{ padding: '12px 15px' }}>السعر</th>
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
                  <td style={{ padding: '14px 15px', color: '#10b981', fontWeight: 'bold' }}>{course.price || 'مجاني'}</td>
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

      {/* نافذة تسجيل بيانات المتدرب (Modal) */}
      {isRegisterModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '15px' }}>
          <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', border: '2px solid #8b44db' }}>
            <h3 style={{ marginTop: 0, color: '#2d3d52', marginBottom: '5px' }}>📝 التسجيل في الكورس</h3>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>{selectedCourseForRegister?.title}</p>
            
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>الاسم الكامل:</label>
                <input 
                  type="text" 
                  value={studentName} 
                  onChange={(e) => setStudentName(e.target.value)} 
                  placeholder="أدخل اسمك الكامل..." 
                  required
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>البريد الإلكتروني:</label>
                <input 
                  type="email" 
                  value={studentEmail} 
                  onChange={(e) => setStudentEmail(e.target.value)} 
                  placeholder="name@example.com" 
                  required
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>رقم الهاتف / الواتساب:</label>
                <input 
                  type="text" 
                  value={studentPhone} 
                  onChange={(e) => setStudentPhone(e.target.value)} 
                  placeholder="010xxxxxxxx" 
                  required
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }} 
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
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
                  style={{ backgroundColor: '#64748b', color: '#fff', border: 'none', padding: '9px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}