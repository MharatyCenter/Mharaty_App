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
  student_name: string;
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

interface ContactInfo {
  phone: string;
  whatsapp: string;
  facebook: string;
  youtube: string;
  instagram: string;
  telegram: string;
  email: string;
  website: string;
  address: string;
  working_hours: string;
}

interface AdminDashboardProps {
  onBack: () => void;
}

export default function AdminDashboardScreen({ onBack }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'courses' | 'registrations' | 'trainers' | 'contact'>('courses');
  
  // رسائل التنبيه الداخلية
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // حالات الكورسات
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [isSavingCourse, setIsSavingCourse] = useState(false);
  
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
  const [isSavingTrainer, setIsSavingTrainer] = useState(false);
  
  const [trainerName, setTrainerName] = useState('');
  const [trainerSpecialty, setTrainerSpecialty] = useState('');
  const [trainerBio, setTrainerBio] = useState('');
  const [trainerImage, setTrainerImage] = useState('');

  // حالات إدارة التواصل
  const [contactData, setContactData] = useState<ContactInfo>({
    phone: '',
    whatsapp: '',
    facebook: '',
    youtube: '',
    instagram: '',
    telegram: '',
    email: '',
    website: '',
    address: '',
    working_hours: ''
  });
  const [isSavingContact, setIsSavingContact] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchRegistrations();
    fetchTrainers();
    fetchContactData();
  }, []);

  const showNotification = (text: string, type: 'success' | 'error') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  const fetchCourses = async () => {
    setLoadingCourses(true);
    const { data, error } = await supabase.from('courses').select('*').order('id', { ascending: false });
    if (!error) setCourses(data || []);
    setLoadingCourses(false);
  };

  const fetchRegistrations = async () => {
    setLoadingRegs(true);
    const { data, error } = await supabase.from('course_registrations').select('*').order('created_at', { ascending: false });
    if (!error) {
      setRegistrations(data || []);
    }
    setLoadingRegs(false);
  };

  const fetchTrainers = async () => {
    setLoadingTrainers(true);
    const { data, error } = await supabase.from('trainers').select('*').order('id', { ascending: false });
    if (!error) {
      setTrainers(data || []);
      if (data && data.length > 0 && !instructor) {
        setInstructor(data[0].name);
      }
    }
    setLoadingTrainers(false);
  };

  const fetchContactData = async () => {
    const { data } = await supabase.from('contact_info').select('*').single();
    if (data) setContactData(data);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCourse(true);
    const coursePayload = { title, instructor, duration, level, description, category, is_active: isActive, month_1: month1, month_2: month2, month_3: month3 };

    if (editingCourseId) {
      const { error } = await supabase.from('courses').update(coursePayload).eq('id', editingCourseId);
      if (error) {
        showNotification('خطأ في التحديث: ' + error.message, 'error');
      } else {
        showNotification('✅ تم تحديث الكورس بنجاح!', 'success');
        resetCourseForm();
        fetchCourses();
      }
    } else {
      const { error } = await supabase.from('courses').insert([coursePayload]);
      if (error) {
        showNotification('خطأ في الإضافة: ' + error.message, 'error');
      } else {
        showNotification('✅ تم إضافة الكورس بنجاح!', 'success');
        resetCourseForm();
        fetchCourses();
      }
    }
    setIsSavingCourse(false);
  };

  const handleEditCourseClick = (course: Course) => {
    setEditingCourseId(course.id);
    setTitle(course.title);
    setInstructor(course.instructor || (trainers.length > 0 ? trainers[0].name : ''));
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
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (!error) {
      showNotification('🗑️ تم حذف الكورس بنجاح', 'success');
      fetchCourses();
    } else {
      showNotification('خطأ في الحذف: ' + error.message, 'error');
    }
  };

  const resetCourseForm = () => {
    setEditingCourseId(null);
    setTitle(''); 
    setInstructor(trainers.length > 0 ? trainers[0].name : ''); 
    setDuration(''); 
    setLevel('مبتدئ');
    setDescription(''); 
    setCategory('digital'); 
    setIsActive(false);
    setMonth1(false); 
    setMonth2(false); 
    setMonth3(false);
    setShowCourseForm(false);
  };

  const handleSaveTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTrainer(true);
    const trainerPayload = { name: trainerName, specialty: trainerSpecialty, bio: trainerBio, image_url: trainerImage };

    if (editingTrainerId) {
      const { error } = await supabase.from('trainers').update(trainerPayload).eq('id', editingTrainerId);
      if (error) {
        showNotification('خطأ في التحديث: ' + error.message, 'error');
      } else {
        showNotification('✅ تم تحديث بيانات المدرب بنجاح!', 'success');
        resetTrainerForm();
        fetchTrainers();
      }
    } else {
      const { error } = await supabase.from('trainers').insert([trainerPayload]);
      if (error) {
        showNotification('خطأ في الإضافة: ' + error.message, 'error');
      } else {
        showNotification('✅ تم إضافة المدرب بنجاح!', 'success');
        resetTrainerForm();
        fetchTrainers();
      }
    }
    setIsSavingTrainer(false);
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
    const { error } = await supabase.from('trainers').delete().eq('id', id);
    if (!error) {
      showNotification('🗑️ تم حذف المدرب بنجاح', 'success');
      fetchTrainers();
    } else {
      showNotification('خطأ في الحذف: ' + error.message, 'error');
    }
  };

  const resetTrainerForm = () => {
    setEditingTrainerId(null);
    setTrainerName(''); setTrainerSpecialty(''); setTrainerBio(''); setTrainerImage('');
    setShowTrainerForm(false);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingContact(true);
    const { error } = await supabase.from('contact_info').upsert({ id: 1, ...contactData });
    setIsSavingContact(false);
    if (error) {
      showNotification('خطأ في حفظ بيانات التواصل: ' + error.message, 'error');
    } else {
      showNotification('✅ تم تحديث بيانات التواصل بنجاح!', 'success');
    }
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

      {/* منطقة الإشعارات الداخلية */}
      {statusMessage && (
        <div style={{ padding: '12px 20px', marginBottom: '20px', borderRadius: '8px', backgroundColor: statusMessage.type === 'success' ? '#dcfce7' : '#fee2e2', color: statusMessage.type === 'success' ? '#166534' : '#991b1b', fontWeight: 'bold', border: `1px solid ${statusMessage.type === 'success' ? '#86efac' : '#fca5a5'}` }}>
          {statusMessage.text}
        </div>
      )}

      {/* أزرار التنقل بين الأقسام */}
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
        <button 
          onClick={() => setActiveTab('contact')}
          style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', backgroundColor: activeTab === 'contact' ? '#2d3d52' : '#cbd5e1', color: activeTab === 'contact' ? '#fff' : '#334155' }}
        >
          📞 إدارة قنوات التواصل
        </button>
      </div>

      {/* 1. قسم إدارة الكورسات */}
      {activeTab === 'courses' && (
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: '#2d3d52' }}>قائمة الكورسات الحالية</h3>
            <button 
              onClick={() => { resetCourseForm(); setShowCourseForm(true); }} 
              disabled={showCourseForm}
              style={{ backgroundColor: showCourseForm ? '#94a3b8' : '#10b981', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: showCourseForm ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
            >
              ➕ إضافة كورس جديد
            </button>
          </div>

          {showCourseForm && (
            <form onSubmit={handleSaveCourse} style={{ backgroundColor: '#f1f5f9', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #cbd5e1' }}>
              <h4 style={{ marginTop: 0, color: '#2d3d52' }}>{editingCourseId ? '✏️ تعديل بيانات الكورس' : '✨ إضافة كورس جديد'}</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                <input type="text" placeholder="عنوان الكورس" value={title} onChange={e => setTitle(e.target.value)} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                
                <select value={instructor} onChange={e => setInstructor(e.target.value)} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option value="" disabled>اختر اسم المدرب</option>
                  {trainers.map(t => (
                    <option key={t.id} value={t.name}>{t.name} ({t.specialty})</option>
                  ))}
                </select>

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
                <button type="submit" disabled={isSavingCourse} style={{ backgroundColor: isSavingCourse ? '#94a3b8' : '#2d3d52', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: isSavingCourse ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                  {isSavingCourse ? 'جاري الحفظ...' : 'حفظ'}
                </button>
                <button type="button" disabled={isSavingCourse} onClick={resetCourseForm} style={{ backgroundColor: '#94a3b8', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer' }}>إلغاء</button>
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
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>{r.student_name || 'غير متوفر'}</td>
                      <td style={{ padding: '10px' }}>{r.email || '-'}</td>
                      <td style={{ padding: '10px' }}>{r.phone || '-'}</td>
                      <td style={{ padding: '10px', color: '#8b44db', fontWeight: 'bold' }}>{r.course_title || '-'}</td>
                      <td style={{ padding: '10px', fontSize: '12px', color: '#64748b' }}>
                        {r.created_at ? new Date(r.created_at).toLocaleString('ar-EG') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. قسم إدارة المدربين */}
      {activeTab === 'trainers' && (
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: '#2d3d52' }}>قائمة المدربين</h3>
            <button 
              onClick={() => { resetTrainerForm(); setShowTrainerForm(true); }} 
              disabled={showTrainerForm}
              style={{ backgroundColor: showTrainerForm ? '#94a3b8' : '#10b981', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: showTrainerForm ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
            >
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
                <button type="submit" disabled={isSavingTrainer} style={{ backgroundColor: isSavingTrainer ? '#94a3b8' : '#2d3d52', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: isSavingTrainer ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                  {isSavingTrainer ? 'جاري الحفظ...' : 'حفظ'}
                </button>
                <button type="button" disabled={isSavingTrainer} onClick={resetTrainerForm} style={{ backgroundColor: '#94a3b8', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer' }}>إلغاء</button>
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

      {/* 4. قسم إدارة قنوات التواصل */}
      {activeTab === 'contact' && (
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0, color: '#2d3d52' }}>إدارة جميع قنوات التواصل والروابط</h3>
          <form onSubmit={handleSaveContact} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px', marginTop: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>رقم الهاتف:</label>
              <input type="text" value={contactData.phone} onChange={e => setContactData({...contactData, phone: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>رقم أو رابط واتساب:</label>
              <input type="text" value={contactData.whatsapp} onChange={e => setContactData({...contactData, whatsapp: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>رابط صفحة فيسبوك:</label>
              <input type="text" value={contactData.facebook} onChange={e => setContactData({...contactData, facebook: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>رابط قناة يوتيوب:</label>
              <input type="text" value={contactData.youtube} onChange={e => setContactData({...contactData, youtube: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>رابط حساب إنستغرام:</label>
              <input type="text" value={contactData.instagram} onChange={e => setContactData({...contactData, instagram: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>رابط حساب تليجرام:</label>
              <input type="text" value={contactData.telegram} onChange={e => setContactData({...contactData, telegram: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>البريد الإلكتروني:</label>
              <input type="email" value={contactData.email} onChange={e => setContactData({...contactData, email: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>رابط الموقع الإلكتروني:</label>
              <input type="text" value={contactData.website} onChange={e => setContactData({...contactData, website: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>العنوان (أسوان):</label>
              <input type="text" value={contactData.address} onChange={e => setContactData({...contactData, address: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>ساعات العمل:</label>
              <input type="text" value={contactData.working_hours} onChange={e => setContactData({...contactData, working_hours: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>
            <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
              <button type="submit" disabled={isSavingContact} style={{ backgroundColor: isSavingContact ? '#94a3b8' : '#2d3d52', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '6px', cursor: isSavingContact ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '15px' }}>
                {isSavingContact ? 'جاري الحفظ...' : 'حفظ بيانات التواصل'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}