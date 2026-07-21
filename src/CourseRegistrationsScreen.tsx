import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

interface Registration {
  id: number;
  course_title: string;
  student_name: string;
  email: string;
  phone: string;
  created_at: string;
}

interface CourseRegistrationsScreenProps {
  onBack: () => void;
}

export default function CourseRegistrationsScreen({ onBack }: CourseRegistrationsScreenProps) {
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

  return (
    <div style={{ direction: 'rtl', textAlign: 'right', padding: '20px', backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      
      {/* الهيدر العلوي */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', backgroundColor: '#2d3d52', padding: '15px 20px', borderRadius: '10px', color: '#fff' }}>
        <h2 style={{ margin: 0, fontSize: '20px' }}>📋 قائمة الطلاب المسجلين في الكورسات</h2>
        <button 
          onClick={onBack} 
          style={{ backgroundColor: '#8b44db', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          ← العودة للرئيسية
        </button>
      </div>

      {/* محتوى الجدول */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#666', fontSize: '16px', marginTop: '50px' }}>جاري تحميل البيانات... 🔄</p>
      ) : registrations.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '80px', color: '#666' }}>
          <p style={{ fontSize: '16px' }}>لا توجد أي تسجيلات حتى الآن.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 3px 10px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ backgroundColor: '#2d3d52', color: '#fff', fontSize: '14px' }}>
                <th style={{ padding: '12px 15px' }}>اسم الطالب</th>
                <th style={{ padding: '12px 15px' }}>الكورس المطلوب</th>
                <th style={{ padding: '12px 15px' }}>البريد الإلكتروني</th>
                <th style={{ padding: '12px 15px' }}>رقم الهاتف / الواتساب</th>
                <th style={{ padding: '12px 15px' }}>تاريخ التسجيل</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((reg, index) => (
                <tr key={reg.id} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '14px 15px', fontWeight: 'bold', color: '#2d3d52' }}>{reg.student_name}</td>
                  <td style={{ padding: '14px 15px', color: '#8b44db', fontWeight: 'bold' }}>{reg.course_title}</td>
                  <td style={{ padding: '14px 15px', color: '#475569' }}>{reg.email}</td>
                  <td style={{ padding: '14px 15px', color: '#065f46', fontWeight: 'bold' }}>{reg.phone}</td>
                  <td style={{ padding: '14px 15px', color: '#666', fontSize: '13px' }}>
                    {new Date(reg.created_at).toLocaleString('ar-EG')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}