import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

interface Trainer {
  id: number;
  name: string;
  specialty: string;
  experience_years: string;
  bio: string;
  email: string;
  phone: string;
  is_active: boolean;
  image_url: string;
}

interface TrainerProps {
  onBack: () => void;
}

export default function Trainer({ onBack }: TrainerProps) {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);

  useEffect(() => {
    fetchTrainers();
    setSelectedTrainer(null);
  }, []);

  const fetchTrainers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .schema('mharaty')
        .from('trainers')
        .select('*');

      if (error) {
        console.error('خطأ:', error.message);
      } else {
        setTrainers(data || []);
      }
    } catch (err) {
      console.error('خطأ غير متوقع:', err);
    } finally {
      setLoading(false);
    }
  };

  // دالة مساعدة للتحقق من صحة رابط الصورة
  const isValidImageUrl = (url: string) => {
    return url && typeof url === 'string' && url.trim().startsWith('http');
  };

  // شاشة تفاصيل السيرة الذاتية للمدرب
  if (selectedTrainer) {
    return (
      <div style={{ direction: 'rtl', textAlign: 'right', padding: '20px', backgroundColor: '#f4f6f8', minHeight: '100vh', fontFamily: 'Tahoma, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', backgroundColor: '#2d3d52', padding: '15px 20px', borderRadius: '10px', color: '#fff' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>👨‍🏫 السيرة الذاتية للمدرب</h2>
          <button onClick={() => setSelectedTrainer(null)} style={{ backgroundColor: '#8b44db', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>العودة لجدول المدربين</button>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '10px', boxShadow: '0 3px 10px rgba(0,0,0,0.06)', display: 'flex', gap: '30px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          
          {/* عرض الصورة أو الأيقونة الاحتياطية في حال كان الرابط غير صالح */}
          {isValidImageUrl(selectedTrainer.image_url) ? (
            <img src={selectedTrainer.image_url} alt={selectedTrainer.name} style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #8b44db' }} />
          ) : (
            <div style={{ width: '150px', height: '150px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px', border: '3px solid #cbd5e1' }}>👤</div>
          )}

          <div style={{ flex: 1 }}>
            <h1 style={{ color: '#2d3d52', marginTop: 0, marginBottom: '20px' }}>{selectedTrainer.name}</h1>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
              <span style={{ backgroundColor: '#f3e8ff', color: '#8b44db', padding: '6px 15px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>🎓 التخصص: {selectedTrainer.specialty}</span>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '20px 0' }} />
            <h3 style={{ color: '#2d3d52', fontSize: '18px' }}>نبذة تعريفية:</h3>
            <p style={{ color: '#555', fontSize: '16px', lineHeight: '1.8' }}>{selectedTrainer.bio || 'لا توجد نبذة مضافة.'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ direction: 'rtl', textAlign: 'right', padding: '20px', backgroundColor: '#f4f6f8', minHeight: '100vh', position: 'relative', fontFamily: 'Tahoma, sans-serif' }}>
      
      {/* هيدر الصفحة */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', backgroundColor: '#2d3d52', padding: '15px 20px', borderRadius: '10px', color: '#fff', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ margin: 0, fontSize: '20px' }}>👨‍🏫 قائمة المدربين المعتمدين</h2>
        
        <button onClick={onBack} style={{ backgroundColor: '#8b44db', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          عودة للرئيسية
        </button>
      </div>

      {/* جدول عرض المدربين */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#666', fontSize: '16px', marginTop: '50px' }}>جاري التحميل... 🔄</p>
      ) : trainers.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '80px', color: '#666' }}>
          <p style={{ fontSize: '16px' }}>لا توجد بيانات مدربين مضافة حالياً.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 3px 10px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ backgroundColor: '#2d3d52', color: '#fff', fontSize: '14px' }}>
                <th style={{ padding: '12px 15px' }}>الصورة</th>
                <th style={{ padding: '12px 15px' }}>اسم المدرب</th>
                <th style={{ padding: '12px 15px' }}>التخصص</th>
                <th style={{ padding: '12px 15px' }}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {trainers.map((trainer, index) => (
                <tr key={trainer.id} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '10px 15px' }}>
                    {isValidImageUrl(trainer.image_url) ? (
                      <img src={trainer.image_url} alt={trainer.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>👤</div>
                    )}
                  </td>
                  <td style={{ padding: '12px 15px' }}>
                    <span onClick={() => setSelectedTrainer(trainer)} style={{ fontWeight: 'bold', color: '#8b44db', cursor: 'pointer', textDecoration: 'underline' }}>
                      {trainer.name}
                    </span>
                  </td>
                  <td style={{ padding: '12px 15px', color: '#475569' }}>{trainer.specialty}</td>
                  <td style={{ padding: '12px 15px' }}>
                    {trainer.is_active ? (
                      <span style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>نشط</span>
                    ) : (
                      <span style={{ backgroundColor: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '20px', fontSize: '12px' }}>غير نشط</span>
                    )}
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