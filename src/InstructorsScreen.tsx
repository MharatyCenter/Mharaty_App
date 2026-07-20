import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

interface Instructor {
  id: number;
  name: string;
  title: string;
  bio: string;
  image_url: string;
  expertise: string;
}

interface InstructorsScreenProps {
  onBack: () => void;
}

export default function InstructorsScreen({ onBack }: InstructorsScreenProps) {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [expertise, setExpertise] = useState('');

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .schema('mharaty')
        .from('instructors')
        .select('*');

      if (error) {
        console.error('خطأ في جلب المدربين:', error.message);
      } else {
        setInstructors(data || []);
      }
    } catch (err) {
      console.error('خطأ غير متوقع:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminMode = () => {
    if (!isAdmin) {
      const password = prompt('الرجاء إدخال كلمة مرور المشرف:');
      if (password === '1234') {
        setIsAdmin(true);
        alert('تم تفعيل وضع المشرف بنجاح');
      } else if (password !== null) {
        alert('كلمة المرور غير صحيحة!');
      }
    } else {
      setIsAdmin(false);
      setIsFormOpen(false);
      alert('تم الخروج من وضع المشرف');
    }
  };

  const handleOpenAddForm = () => {
    setEditingId(null);
    setName('');
    setTitle('');
    setBio('');
    setImageUrl('');
    setExpertise('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (instructor: Instructor, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(instructor.id);
    setName(instructor.name);
    setTitle(instructor.title || '');
    setBio(instructor.bio || '');
    setImageUrl(instructor.image_url || '');
    setExpertise(instructor.expertise || '');
    setIsFormOpen(true);
  };

  const handleSaveInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert('يرجى إدخال اسم المدرب على الأقل');
      return;
    }

    const instructorData = {
      name,
      title,
      bio,
      image_url: imageUrl,
      expertise
    };

    if (editingId) {
      const { error } = await supabase
        .schema('mharaty')
        .from('instructors')
        .update(instructorData)
        .eq('id', editingId);

      if (error) {
        alert('حدث خطأ أثناء التعديل: ' + error.message);
      } else {
        setIsFormOpen(false);
        fetchInstructors();
      }
    } else {
      const { error } = await supabase
        .schema('mharaty')
        .from('instructors')
        .insert([instructorData]);

      if (error) {
        alert('حدث خطأ أثناء الإضافة: ' + error.message);
      } else {
        setIsFormOpen(false);
        fetchInstructors();
      }
    }
  };

  const handleDeleteInstructor = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('هل أنت متأكد من حذف سيرة هذا المدرب؟')) {
      const { error } = await supabase
        .schema('mharaty')
        .from('instructors')
        .delete()
        .eq('id', id);

      if (error) {
        alert('حدث خطأ أثناء الحذف: ' + error.message);
      } else {
        fetchInstructors();
      }
    }
  };

  if (selectedInstructor) {
    return (
      <div style={{ direction: 'rtl', textAlign: 'right', padding: '20px', backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', backgroundColor: '#2d3d52', padding: '15px 20px', borderRadius: '10px', color: '#fff' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>👨‍🏫 السيرة الذاتية للمدرب</h2>
          <button onClick={() => setSelectedInstructor(null)} style={{ backgroundColor: '#8b44db', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>العودة لقائمة المدربين</button>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 3px 10px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <img 
            src={selectedInstructor.image_url || 'https://via.placeholder.com/150'} 
            alt={selectedInstructor.name} 
            style={{ width: '130px', height: '130px', borderRadius: '50%', objectFit: 'cover', marginBottom: '15px', border: '4px solid #8b44db' }} 
          />
          <h1 style={{ color: '#2d3d52', margin: '0 0 5px 0' }}>{selectedInstructor.name}</h1>
          <p style={{ color: '#8b44db', fontSize: '15px', fontWeight: 'bold', margin: '0 0 20px 0' }}>{selectedInstructor.title}</p>
          
          <div style={{ width: '100%', maxWidth: '700px', textAlign: 'right', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ color: '#2d3d52', fontSize: '16px', marginTop: 0 }}>📌 نبذة تعريفية:</h3>
            <p style={{ color: '#555', fontSize: '15px', lineHeight: '1.8', margin: 0 }}>{selectedInstructor.bio || 'لا توجد نبذة متوفرة حالياً.'}</p>
          </div>

          <div style={{ width: '100%', maxWidth: '700px', textAlign: 'right', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ color: '#2d3d52', fontSize: '16px', marginTop: 0 }}>💡 المهارات والخبرات:</h3>
            <p style={{ color: '#555', fontSize: '15px', lineHeight: '1.8', margin: 0 }}>{selectedInstructor.expertise || 'غير متوفرة.'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ direction: 'rtl', textAlign: 'right', padding: '20px', backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', backgroundColor: '#2d3d52', padding: '15px 20px', borderRadius: '10px', color: '#fff', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ margin: 0, fontSize: '20px' }}>👨‍🏫 نخبة المدربين الخبراء</h2>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={toggleAdminMode} style={{ backgroundColor: isAdmin ? '#ef4444' : '#475569', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
            {isAdmin ? '🔒 خروج المشرف' : '🔑 دخول المشرف'}
          </button>

          {isAdmin && (
            <button onClick={handleOpenAddForm} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              ➕ إضافة مدرب جديد
            </button>
          )}

          <button onClick={onBack} style={{ backgroundColor: '#8b44db', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            عودة للرئيسية
          </button>
        </div>
      </div>

      {isAdmin && isFormOpen && (
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', marginBottom: '25px', boxShadow: '0 3px 10px rgba(0,0,0,0.08)', border: '2px solid #8b44db' }}>
          <h3 style={{ marginTop: 0, color: '#2d3d52' }}>{editingId ? '✏️ تعديل بيانات المدرب' : '➕ إضافة مدرب جديد'}</h3>
          <form onSubmit={handleSaveInstructor} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>اسم المدرب:</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="مثال: أ. أسامة صلاح" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>المسمى الوظيفي / التخصص:</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: خبير تطوير الويب" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>رابط الصورة الشخصية (URL):</label>
                <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="رابط صورة صحيح" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>المهارات والخبرات:</label>
              <input type="text" value={expertise} onChange={(e) => setExpertise(e.target.value)} placeholder="مثال: React, Supabase, UI/UX" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>نبذة تعريفية:</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="اكتب نبذة مختصرة عن خبرات المدرب..." style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}></textarea>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={{ backgroundColor: '#8b44db', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>💾 حفظ</button>
              <button type="button" onClick={() => setIsFormOpen(false)} style={{ backgroundColor: '#64748b', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', color: '#666', fontSize: '16px', marginTop: '50px' }}>جاري التحميل... 🔄</p>
      ) : instructors.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '80px', color: '#666' }}>
          <p style={{ fontSize: '16px' }}>لا توجد سير ذاتية للمدربين مضافة حالياً.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {instructors.map((instructor) => (
            <div 
              key={instructor.id} 
              onClick={() => setSelectedInstructor(instructor)}
              style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 3px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s', borderTop: '4px solid #8b44db' }}
            >
              <img 
                src={instructor.image_url || 'https://via.placeholder.com/120'} 
                alt={instructor.name} 
                style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', marginBottom: '12px', border: '2px solid #8b44db' }} 
              />
              <h3 style={{ margin: '0 0 5px 0', color: '#2d3d52', fontSize: '17px' }}>{instructor.name}</h3>
              <p style={{ color: '#8b44db', fontSize: '13px', fontWeight: 'bold', margin: '0 0 10px 0' }}>{instructor.title}</p>
              <p style={{ color: '#666', fontSize: '13px', margin: '0 0 15px 0', lineHeight: '1.4', flexGrow: 1 }}>
                {instructor.bio ? instructor.bio.substring(0, 80) + '...' : 'ضغط لعرض التفاصيل الكاملة...'}
              </p>

              {isAdmin && (
                <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '10px' }} onClick={(e) => e.stopPropagation()}>
                  <button onClick={(e) => handleOpenEditForm(instructor, e)} style={{ flex: 1, backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>تعديل</button>
                  <button onClick={(e) => handleDeleteInstructor(instructor.id, e)} style={{ flex: 1, backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>حذف</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}