import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

interface Registration {
  id: number;
  course_title: string;
  student_name: string;
  email: string;
  phone: string;
  created_at?: string;
}

interface RegistrationsListProps {
  onBack: () => void;
}

export default function RegistrationsList({ onBack }: RegistrationsListProps) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .schema('mharaty')
        .from('course_registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('خطأ في جلب بيانات المسجلين:', error.message);
      } else {
        setRegistrations(data || []);
      }
    } catch (err) {
      console.error('خطأ غير متوقع:', err);
    } finally {
      setLoading(false);
    }
  };

  // تجميع المسجلين بناءً على اسم الكورس
  const groupedByCourse = registrations.reduce((acc, reg) => {
    const courseTitle = reg.course_title || 'كورسات غير مسماة';
    if (!acc[courseTitle]) {
      acc[courseTitle] = [];
    }
    acc[courseTitle].push(reg);
    return acc;
  }, {} as Record<string, Registration[]>);

  return (
    <div style={{ direction: 'rtl', textAlign: 'right', padding: '20px', backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      
      {/* الهيدر العلوي */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', backgroundColor: '#2d3d52', padding: '15px 20px', borderRadius: '10px', color: '#fff' }}>
        <h2 style={{ margin: 0, fontSize: '20px' }}>👥 لوحة متابعة الطلاب المسجلين (مرتبة حسب الكورس)</h2>
        <button 
          onClick={onBack} 
          style={{ backgroundColor: '#8b44db', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          ← العودة للرئيسية
        </button>
      </div>

      {/* المحتوى */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#666', fontSize: '16px', marginTop: '50px' }}>جاري تحميل قائمة المسجلين... 🔄</p>
      ) : Object.keys(groupedByCourse).length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '80px', color: '#666' }}>
          <p style={{ fontSize: '16px' }}>لا توجد أي تسجيلات للكورسات حتى الآن.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          {Object.entries(groupedByCourse).map(([courseTitle, students]) => (
            <div key={courseTitle} style={{ backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 3px 10px rgba(0,0,0,0.06)', overflow: 'hidden', borderRight: '5px solid #8b44db' }}>
              
              {/* عنوان الكورس */}
              <div style={{ backgroundColor: '#f8fafc', padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: '#2d3d52', fontSize: '18px' }}>📖 {courseTitle}</h3>
                <span style={{ backgroundColor: '#f3e8ff', color: '#8b44db', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>
                  عدد المسجلين: {students.length}
                </span>
              </div>

              {/* جدول الطلاب المسجلين في هذا الكورس */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#2d3d52', color: '#fff', fontSize: '13px' }}>
                      <th style={{ padding: '10px 15px' }}>اسم الطالب</th>
                      <th style={{ padding: '10px 15px' }}>البريد الإلكتروني</th>
                      <th style={{ padding: '10px 15px' }}>رقم الهاتف / الواتساب</th>
                      <th style={{ padding: '10px 15px' }}>وقت التسجيل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, index) => (
                      <tr key={student.id} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa', fontSize: '14px' }}>
                        <td style={{ padding: '12px 15px', fontWeight: 'bold', color: '#334155' }}>
                          {student.student_name || 'بدون اسم'}
                        </td>
                        <td style={{ padding: '12px 15px', color: '#475569' }}>{student.email}</td>
                        <td style={{ padding: '12px 15px', color: '#475569' }}>{student.phone}</td>
                        <td style={{ padding: '12px 15px', color: '#666', fontSize: '13px' }}>
                          {student.created_at ? new Date(student.created_at).toLocaleDateString('ar-EG') : 'غير متوفر'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}