import { useState, useEffect } from 'react';
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

interface Registration {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  course_title: string;
  created_at: string;
}

interface Trainer {
  id: number;
  name: string;
  specialty: string;
  bio: string;
  image_url: string;
}

interface AdminDashboardProps {
  onBack: () => void;
}

export default function AdminDashboardScreen({ onBack }: AdminDashboardProps) {
  // إضافة تبويب 'trainers' لإدارة المدربين
  const [activeTab, setActiveTab] = useState<'courses' | 'registrations' | 'trainers'>('courses');
  
  // حالات الكورسات
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  
  // حقول نموذج الكورس
  const [title, setTitle] = useState('');
  const [instructor, setInstructor] = useState('');
  const [duration, setDuration] = useState('');
  const [level, setLevel] = useState('مبتدئ');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'digital' | 'professional' | 'life'>('digital');
  const [isActive, setIsActive] = useState(false);
  const [month1, setMonth1] = useState(false);
  const [month2, setMonth2] = useState(false);
  const [month3, setMonth3] = useState(false);

  // حالات المسجلين
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);

  // حالات المدربين
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loadingTrainers, setLoadingTrainers] = useState(false);
  const [showTrainerForm, setShowTrainerForm] = useState(false);
  const [editingTrainerId, setEditingTrainerId] = useState<number | null>(null);
  
  // حقول نموذج المدرب
  const [trainerName, setTrainerName] = useState('');
  const [trainerSpecialty, setTrainerSpecialty] = useState('');
  const [trainerBio, setTrainerBio] = useState('');
  const [trainerImage, setTrainerImage] = useState('');

  useEffect(() => {
    fetchCourses();
    fetchRegistrations();
    fetchTrainers();
  }, []);

  const fetchCourses = async () => {
    setLoadingCourses(true);
    const { data, error } = await supabase.from('courses').select('*').order('id', { ascending: false });
    if (!error) setCourses(data || []);
    setLoadingCourses(false);
  };

  const fetchRegistrations = async () => {
    setLoadingRegs(true);
    const { data, error } = await supabase.from('course_registrations').select('*').order('created_at', { ascending: false });
    if (!error) setRegistrations(data || []);
    setLoadingRegs(false);
  };

  const fetchTrainers = async () => {
    setLoadingTrainers(true);
    const { data, error } = await supabase.from('trainers').select('*').order('id', { ascending: false });
    if (!error) setTrainers(data || []);
    setLoadingTrainers(false);
  };

  // دوال حفظ وتعديل الكورسات
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const courseData = { title, instructor, duration, level, description, category, is_active: isActive, month_1: month1, month_2: month2, month_3: month3 };

    if (editingCourseId) {
      const { error } = await supabase.from('courses').update(courseData).eq('id', editingCourseId);
      if (error) alert('خطأ في التحديث: ' + error.message);
      else alert('✅ تم تحديث الكورس بنجاح!');
    } else {
      const { error } = await supabase.from('courses').insert([courseData]);
      if (error) alert('خطأ في الإضافة: ' + error.message);
      else alert('✅ تم إضافة الكورس بنجاح!');
    }

    resetCourseForm();
    fetchCourses();
  };

  const handleEditCourseClick = (course: Course) => {
    setEditingCourseId(course.id);
    setTitle(course.title);
    setInstructor(course.instructor);
    setDuration(course.duration);
    setLevel(course.level);
    setDescription(course.description);
    setCategory(course.category);
    setIsActive(course.is_active);
    setMonth1(course.month_1);
    setMonth2(course.month_2);
    setMonth3(course.month_3);
    setShowCourseForm(true);
  };

  const handleDeleteCourse = async (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الكورس؟')) {
      const { error } = await supabase.from('courses').delete().eq('id', id);
      if (!error) fetchCourses();
    }
  };

  const resetCourseForm = () => {
    setEditingCourseId(null);
    setTitle(''); setInstructor(''); setDuration(''); setLevel('مبتدئ');
    setDescription(''); setCategory('digital'); setIsActive(false);
    setMonth1(false); setMonth2(false); setMonth3(false);
    setShowCourseForm(false);
  };

  // دوال حفظ وتعديل المدربين
  const handleSaveTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    const trainerData = { name: trainerName, specialty: trainerSpecialty, bio: trainerBio, image_url: trainerImage };

    if (editingTrainerId) {
      const { error } = await supabase.from('trainers').update(trainerData).eq('id', editingTrainerId);
      if (error) alert('خطأ في التحديث: ' + error.message);
      else alert('✅ تم تحديث بيانات المدرب بنجاح!');
    } else {
      const { error } = await supabase.from('trainers').insert([trainerData]);
      if (error) alert('خطأ في الإضافة: ' + error.message);
      else alert('✅ تم إضافة المدرب بنجاح!');
    }

    resetTrainerForm();
    fetchTrainers();
  };

  const handleEditTrainerClick = (trainer: Trainer) => {
    setEditingTrainerId(trainer.id);
    setTrainerName(trainer.name);
    setTrainerSpecialty(trainer.specialty);
    setTrainerBio(trainer.bio);
    setTrainerImage(trainer.image_url);
    setShowTrainerForm(true);
  };

  const handleDeleteTrainer = async (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المدرب؟')) {
      const { error } = await supabase.from('trainers').delete().eq('id', id);
      if (!error) fetchTrainers();
    }
  };

  const resetTrainerForm = () => {
    setEditingTrainerId(null);
    setTrainerName(''); setTrainerSpecialty(''); setTrainerBio(''); setTrainerImage('');
    setShowTrainerForm(false);
  };

  return (
    <div style={{ direction: 'rtl', textAlign: 'right', padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Tahoma, sans-serif' }}>
      
      {/* هيدر لوحة التحكم */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2d3d52', padding: '15px 25px', borderRadius: '12px', color: '#fff', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>🛠️ لوحة تحكم المشرف الشاملة</h2>
        <button onClick={onBack} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          تسجيل خروج / العودة للرئيسية
        </button>
      </div>

      {/* أزرار التنقل بين الأقسام (Tabs) */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveTab('courses')}
          style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', backgroundColor: activeTab === 'courses' ? '#2d3d52' : '#cbd5e1', color: activeTab === 'courses' ? '#fff' : '#334155' }}
        >
          📁 إدارة الكورسات والخطط
        </button>
        <button 
          onClick={() => setActiveTab('registrations')}
          style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', backgroundColor: activeTab === 'registrations' ? '#2d3d52' : '#cbd5e1', color: activeTab === 'registrations' ? '#fff' : '#334155' }}
        >
          📊 طلبات التسجيل ({registrations.length})
        </button>
        <button 
          onClick={() => setActiveTab('trainers')}
          style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', backgroundColor: activeTab === 'trainers' ? '#2d3d52' : '#cbd5e1', color: activeTab === 'trainers' ? '#fff' : '#334155' }}
        >
          👨‍🏫 إدارة المدربين ({trainers.length})
        </button>
      </div>

      {/* 1. قسم إدارة الكورسات */}
      {activeTab === 'courses' && (
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: '#2d3d52' }}>قائمة الكورسات الحالية</h3>
            <button onClick={() => { resetCourseForm(); setShowCourseForm(true); }} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              ➕ إضافة كورس جديد
            </button>
          </div>

          {showCourseForm && (
            <form onSubmit={handleSaveCourse} style={{ backgroundColor: '#f1f5f9', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #cbd5e1' }}>
              <h4 style={{ marginTop: 0, color: '#2d3d52' }}>{editingCourseId ? '✏️ تعديل بيانات الكورس' : '✨ إضافة كورس جديد'}</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                <input type="text" placeholder="عنوان الكورس" value={title} onChange={e => setTitle(e.target.value)} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                <input type="text" placeholder="اسم المدرب" value={instructor} onChange={e => setInstructor(e.target.value)} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                <input type="text" placeholder="المدة (مثال: 4 أسابيع)" value={duration} onChange={e => setDuration(e.target.value)} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                <select value={category} onChange={e => setCategory(e.target.value as any)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option value="digital">مهارات رقمية</option>
                  <option value="professional">مهارات مهنية</option>
                  <option value="life">مهارات حياتية</option>
                </select>
              </div>
              <textarea placeholder="وصف الكورس..." value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '15px' }}></textarea>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '15px', fontSize: '14px' }}>
                <label><input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} /> ⚡ كورس نشط حالياً</label>
                <label><input type="checkbox" checked={month1} onChange={e => setMonth1(e.target.checked)} /> 📅 الشهر الأول</label>
                <label><input type="checkbox" checked={month2} onChange={e => setMonth2(e.target.checked)} /> 📅 الشهر الثاني</label>
                <label><input type="checkbox" checked={month3} onChange={e => setMonth3(e.target.checked)} /> 📅 الشهر الثالث</label>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ backgroundColor: '#2d3d52', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>حفظ</button>
                <button type="button" onClick={resetCourseForm} style={{ backgroundColor: '#94a3b8', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer' }}>إلغاء</button>
              </div>
            </form>
          )}

          {loadingCourses ? <p>جاري التحميل...</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#2d3d52', color: '#fff', textAlign: 'right' }}>
                    <th style={{ padding: '10px' }}>العنوان</th>
                    <th style={{ padding: '10px' }}>القسم</th>
                    <th style={{ padding: '10px' }}>المدرب</th>
                    <th style={{ padding: '10px' }}>الحالة</th>
                    <th style={{ padding: '10px' }}>الخطط (أشهر)</th>
                    <th style={{ padding: '10px' }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>{c.title}</td>
                      <td style={{ padding: '10px' }}>{c.category === 'digital' ? 'رقمية' : c.category === 'professional' ? 'مهنية' : 'حياتية'}</td>
                      <td style={{ padding: '10px' }}>{c.instructor}</td>
                      <td style={{ padding: '10px' }}>{c.is_active ? <span style={{ color: '#10b981', fontWeight: 'bold' }}>نشط حالياً</span> : <span style={{ color: '#64748b' }}>غير نشط</span>}</td>
                      <td style={{ padding: '10px', fontSize: '12px' }}>{c.month_1 && 'شهر 1 '} {c.month_2 && 'شهر 2 '} {c.month_3 && 'شهر 3'}</td>
                      <td style={{ padding: '10px', display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleEditCourseClick(c)} style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>تعديل</button>
                        <button onClick={() => handleDeleteCourse(c.id)} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>حذف</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 2. قسم طلبات التسجيل */}
      {activeTab === 'registrations' && (
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0, color: '#2d3d52' }}>سجل الطلاب المسجلين في الدورات</h3>
          {loadingRegs ? <p>جاري التحميل...</p> : registrations.length === 0 ? (
            <p style={{ color: '#64748b' }}>لا توجد طلبات تسجيل حتى الآن.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#2d3d52', color: '#fff', textAlign: 'right' }}>
                    <th style={{ padding: '10px' }}>اسم الطالب</th>
                    <th style={{ padding: '10px' }}>البريد الإلكتروني</th>
                    <th style={{ padding: '10px' }}>رقم الهاتف</th>
                    <th style={{ padding: '10px' }}>الكورس المسجل به</th>
                    <th style={{ padding: '10px' }}>تاريخ التسجيل</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>{r.full_name}</td>
                      <td style={{ padding: '10px' }}>{r.email}</td>
                      <td style={{ padding: '10px' }}>{r.phone}</td>
                      <td style={{ padding: '10px', color: '#8b44db', fontWeight: 'bold' }}>{r.course_title}</td>
                      <td style={{ padding: '10px', fontSize: '12px', color: '#64748b' }}>{new Date(r.created_at).toLocaleString('ar-EG')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. قسم إدارة المدربين الجديد */}
      {activeTab === 'trainers' && (
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: '#2d3d52' }}>قائمة المدربين</h3>
            <button onClick={() => { resetTrainerForm(); setShowTrainerForm(true); }} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              ➕ إضافة مدرب جديد
            </button>
          </div>

          {showTrainerForm && (
            <form onSubmit={handleSaveTrainer} style={{ backgroundColor: '#f1f5f9', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #cbd5e1' }}>
              <h4 style={{ marginTop: 0, color: '#2d3d52' }}>{editingTrainerId ? '✏️ تعديل بيانات المدرب' : '✨ إضافة مدرب جديد'}</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                <input type="text" placeholder="اسم المدرب" value={trainerName} onChange={e => setTrainerName(e.target.value)} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                <input type="text" placeholder="التخصص (مثال: خبير برمجة)" value={trainerSpecialty} onChange={e => setTrainerSpecialty(e.target.value)} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                <input type="text" placeholder="رابط صورة المدرب (URL)" value={trainerImage} onChange={e => setTrainerImage(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <textarea placeholder="نبذة تعريفية عن المدرب..." value={trainerBio} onChange={e => setTrainerBio(e.target.value)} rows={3} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '15px' }}></textarea>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ backgroundColor: '#2d3d52', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>حفظ</button>
                <button type="button" onClick={resetTrainerForm} style={{ backgroundColor: '#94a3b8', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer' }}>إلغاء</button>
              </div>
            </form>
          )}

          {loadingTrainers ? <p>جاري التحميل...</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#2d3d52', color: '#fff', textAlign: 'right' }}>
                    <th style={{ padding: '10px' }}>اسم المدرب</th>
                    <th style={{ padding: '10px' }}>التخصص</th>
                    <th style={{ padding: '10px' }}>النبذة</th>
                    <th style={{ padding: '10px' }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {trainers.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>{t.name}</td>
                      <td style={{ padding: '10px', color: '#8b44db' }}>{t.specialty}</td>
                      <td style={{ padding: '10px', color: '#64748b' }}>{t.bio ? t.bio.substring(0, 50) + '...' : '-'}</td>
                      <td style={{ padding: '10px', display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleEditTrainerClick(t)} style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>تعديل</button>
                        <button onClick={() => handleDeleteTrainer(t.id)} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>حذف</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}