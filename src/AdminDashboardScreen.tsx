import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

interface Course {
  id: number;
  title: string;
  instructor: string;
  duration: string;
  level: string;
  description: string;
  category: string;
  is_active: boolean;
  progress_percentage: number;
  trainees_performance: string;
  month_1: boolean;
  month_2: boolean;
  month_3: boolean;
}

interface Registration {
  id: number;
  course_title: string;
  student_name: string;
  email: string;
  phone: string;
  created_at: string;
}

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

interface ContactMessage {
  id: number;
  sender_name: string;
  sender_email: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface SiteAnalytics {
  id: number;
  visit_date: string;
  visitor_count: number;
}

interface AdminDashboardProps {
  onBack: () => void;
}

export default function AdminDashboardScreen({ onBack }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'courses' | 'registrations' | 'trainers' | 'contact' | 'messages' | 'analytics'>('courses');
  
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
  const [category, setCategory] = useState('digital');
  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [performance, setPerformance] = useState('');
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
  const [trainerExp, setTrainerExp] = useState('');
  const [trainerBio, setTrainerBio] = useState('');
  const [trainerEmail, setTrainerEmail] = useState('');
  const [trainerPhone, setTrainerPhone] = useState('');
  const [trainerImage, setTrainerImage] = useState('');
  const [trainerIsActive, setTrainerIsActive] = useState(true);

  // حالات التواصل والرسائل والإحصائيات
  const [contactData, setContactData] = useState<ContactInfo>({
    phone: '', whatsapp: '', facebook: '', youtube: '', instagram: '', telegram: '', email: '', website: '', address: '', working_hours: ''
  });
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [analytics, setAnalytics] = useState<SiteAnalytics[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const showNotification = (text: string, type: 'success' | 'error') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const fetchAllData = async () => {
    // 1. الكورسات
    setLoadingCourses(true);
    const { data: cData } = await supabase.schema('mharaty').from('courses').select('*').order('id', { ascending: false });
    if (cData) setCourses(cData);
    setLoadingCourses(false);

    // 2. التسجيلات
    setLoadingRegs(true);
    const { data: rData } = await supabase.schema('mharaty').from('course_registrations').select('*').order('created_at', { ascending: false });
    if (rData) setRegistrations(rData);
    setLoadingRegs(false);

    // 3. المدربين
    setLoadingTrainers(true);
    const { data: tData } = await supabase.schema('mharaty').from('trainers').select('*').order('id', { ascending: false });
    if (tData) {
      setTrainers(tData);
      if (tData.length > 0 && !instructor) setInstructor(tData[0].name);
    }
    setLoadingTrainers(false);

    // 4. معلومات التواصل
    const { data: conData } = await supabase.schema('mharaty').from('contact_info').select('*').single();
    if (conData) setContactData(conData);

    // 5. الرسائل
    const { data: mData } = await supabase.schema('mharaty').from('contact_messages').select('*').order('created_at', { ascending: false });
    if (mData) setMessages(mData);

    // 6. الإحصائيات
    const { data: aData } = await supabase.schema('mharaty').from('site_analytics').select('*').order('visit_date', { ascending: false }).limit(30);
    if (aData) setAnalytics(aData);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCourse(true);
    const payload = { 
      title, instructor, duration, level, description, category, 
      is_active: isActive, progress_percentage: progress, trainees_performance: performance,
      month_1: month1, month_2: month2, month_3: month3 
    };

    const query = editingCourseId 
      ? supabase.schema('mharaty').from('courses').update(payload).eq('id', editingCourseId)
      : supabase.schema('mharaty').from('courses').insert([payload]);

    const { error } = await query;
    setIsSavingCourse(false);

    if (error) {
      showNotification('خطأ: ' + error.message, 'error');
    } else {
      showNotification('✅ تم الحفظ بنجاح!', 'success');
      resetCourseForm();
      fetchAllData();
    }
  };

  const handleEditCourseClick = (c: Course) => {
    setEditingCourseId(c.id);
    setTitle(c.title);
    setInstructor(c.instructor);
    setDuration(c.duration);
    setLevel(c.level);
    setDescription(c.description);
    setCategory(c.category);
    setIsActive(c.is_active);
    setProgress(c.progress_percentage || 0);
    setPerformance(c.trainees_performance || '');
    setMonth1(c.month_1);
    setMonth2(c.month_2);
    setMonth3(c.month_3);
    setShowCourseForm(true);
  };

  const handleDeleteCourse = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من الحذف؟')) return;
    const { error } = await supabase.schema('mharaty').from('courses').delete().eq('id', id);
    if (!error) {
      showNotification('🗑️ تم الحذف بنجاح', 'success');
      fetchAllData();
    } else {
      showNotification('خطأ في الحذف', 'error');
    }
  };

  const resetCourseForm = () => {
    setEditingCourseId(null);
    setTitle(''); setDuration(''); setLevel('مبتدئ'); setDescription(''); setCategory('digital');
    setIsActive(false); setProgress(0); setPerformance(''); setMonth1(false); setMonth2(false); setMonth3(false);
    setShowCourseForm(false);
  };

  const handleSaveTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTrainer(true);
    const payload = { 
      name: trainerName, specialty: trainerSpecialty, experience_years: trainerExp, 
      bio: trainerBio, email: trainerEmail, phone: trainerPhone, is_active: trainerIsActive, image_url: trainerImage 
    };

    const query = editingTrainerId
      ? supabase.schema('mharaty').from('trainers').update(payload).eq('id', editingTrainerId)
      : supabase.schema('mharaty').from('trainers').insert([payload]);

    const { error } = await query;
    setIsSavingTrainer(false);

    if (error) {
      showNotification('خطأ: ' + error.message, 'error');
    } else {
      showNotification('✅ تم حفظ المدرب بنجاح!', 'success');
      resetTrainerForm();
      fetchAllData();
    }
  };

  const handleEditTrainerClick = (t: Trainer) => {
    setEditingTrainerId(t.id);
    setTrainerName(t.name);
    setTrainerSpecialty(t.specialty);
    setTrainerExp(t.experience_years || '');
    setTrainerBio(t.bio || '');
    setTrainerEmail(t.email || '');
    setTrainerPhone(t.phone || '');
    setTrainerIsActive(t.is_active);
    setTrainerImage(t.image_url || '');
    setShowTrainerForm(true);
  };

  const handleDeleteTrainer = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من الحذف؟')) return;
    const { error } = await supabase.schema('mharaty').from('trainers').delete().eq('id', id);
    if (!error) {
      showNotification('🗑️ تم حذف المدرب', 'success');
      fetchAllData();
    }
  };

  const resetTrainerForm = () => {
    setEditingTrainerId(null);
    setTrainerName(''); setTrainerSpecialty(''); setTrainerExp(''); setTrainerBio('');
    setTrainerEmail(''); setTrainerPhone(''); setTrainerImage(''); setTrainerIsActive(true);
    setShowTrainerForm(false);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingContact(true);
    const { error } = await supabase.schema('mharaty').from('contact_info').upsert({ id: 1, ...contactData });
    setIsSavingContact(false);
    if (error) {
      showNotification('خطأ في حفظ التواصل', 'error');
    } else {
      showNotification('✅ تم تحديث قنوات التواصل بنجاح', 'success');
    }
  };

  return (
    <div style={{ direction: 'rtl', textAlign: 'right', padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Tahoma, sans-serif' }}>
      
      {/* الهيدر */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2d3d52', padding: '15px 25px', borderRadius: '12px', color: '#fff', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>🛠️ لوحة تحكم مشروع مهاراتي (Schema: mharaty)</h2>
        <button onClick={onBack} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          تسجيل خروج / العودة للرئيسية
        </button>
      </div>

      {statusMessage && (
        <div style={{ padding: '12px 20px', marginBottom: '20px', borderRadius: '8px', backgroundColor: statusMessage.type === 'success' ? '#dcfce7' : '#fee2e2', color: statusMessage.type === 'success' ? '#166534' : '#991b1b', fontWeight: 'bold' }}>
          {statusMessage.text}
        </div>
      )}

      {/* شريط التنقل */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { id: 'courses', label: `📁 الكورسات (${courses.length})` },
          { id: 'registrations', label: `📊 التسجيلات (${registrations.length})` },
          { id: 'trainers', label: `👨‍🏫 المدربين (${trainers.length})` },
          { id: 'contact', label: '📞 قنوات التواصل' },
          { id: 'messages', label: `💬 الرسائل (${messages.length})` },
          { id: 'analytics', label: '📈 الإحصائيات' },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', backgroundColor: activeTab === tab.id ? '#2d3d52' : '#cbd5e1', color: activeTab === tab.id ? '#fff' : '#334155' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. قسم الكورسات */}
      {activeTab === 'courses' && (
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: '#2d3d52' }}>إدارة الكورسات التدريبية</h3>
            <button onClick={() => { resetCourseForm(); setShowCourseForm(true); }} disabled={showCourseForm} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              ➕ إضافة كورس جديد
            </button>
          </div>

          {showCourseForm && (
            <form onSubmit={handleSaveCourse} style={{ backgroundColor: '#f1f5f9', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #cbd5e1' }}>
              <h4 style={{ marginTop: 0, color: '#2d3d52' }}>{editingCourseId ? '✏️ تعديل كورس' : '✨ إضافة كورس'}</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                <input type="text" placeholder="عنوان الكورس" value={title} onChange={e => setTitle(e.target.value)} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                <input type="text" placeholder="اسم المدرب" value={instructor} onChange={e => setInstructor(e.target.value)} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                <input type="text" placeholder="المدة (مثال: 4 أسابيع)" value={duration} onChange={e => setDuration(e.target.value)} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                <input type="text" placeholder="المستوى" value={level} onChange={e => setLevel(e.target.value)} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                <input type="text" placeholder="التصنيف (digital, etc)" value={category} onChange={e => setCategory(e.target.value)} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                <input type="number" placeholder="نسبة الإنجاز %" value={progress} onChange={e => setProgress(Number(e.target.value))} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <textarea placeholder="وصف الكورس..." value={description} onChange={e => setDescription(e.target.value)} rows={2} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '15px' }}></textarea>
              <textarea placeholder="أداء المتدربين..." value={performance} onChange={e => setPerformance(e.target.value)} rows={2} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '15px' }}></textarea>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '15px', fontSize: '14px' }}>
                <label><input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} /> نشط حالياً</label>
                <label><input type="checkbox" checked={month1} onChange={e => setMonth1(e.target.checked)} /> الشهر 1</label>
                <label><input type="checkbox" checked={month2} onChange={e => setMonth2(e.target.checked)} /> الشهر 2</label>
                <label><input type="checkbox" checked={month3} onChange={e => setMonth3(e.target.checked)} /> الشهر 3</label>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" disabled={isSavingCourse} style={{ backgroundColor: '#2d3d52', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>حفظ</button>
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
                    <th style={{ padding: '10px' }}>المدرب</th>
                    <th style={{ padding: '10px' }}>الحالة</th>
                    <th style={{ padding: '10px' }}>الخطط</th>
                    <th style={{ padding: '10px' }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>{c.title}</td>
                      <td style={{ padding: '10px' }}>{c.instructor}</td>
                      <td style={{ padding: '10px' }}>{c.is_active ? <span style={{ color: '#10b981' }}>نشط</span> : 'غير نشط'}</td>
                      <td style={{ padding: '10px' }}>{c.month_1 && 'ش1 '} {c.month_2 && 'ش2 '} {c.month_3 && 'ش3'}</td>
                      <td style={{ padding: '10px', display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleEditCourseClick(c)} style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>تعديل</button>
                        <button onClick={() => handleDeleteCourse(c.id)} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>حذف</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 2. التسجيلات */}
      {activeTab === 'registrations' && (
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0, color: '#2d3d52' }}>طلبات التسجيل في الدورات</h3>
          {loadingRegs ? <p>جاري التحميل...</p> : registrations.length === 0 ? <p>لا توجد طلبات.</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#2d3d52', color: '#fff', textAlign: 'right' }}>
                    <th style={{ padding: '10px' }}>اسم الطالب</th>
                    <th style={{ padding: '10px' }}>البريد</th>
                    <th style={{ padding: '10px' }}>الهاتف</th>
                    <th style={{ padding: '10px' }}>الكورس</th>
                    <th style={{ padding: '10px' }}>التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>{r.student_name}</td>
                      <td style={{ padding: '10px' }}>{r.email}</td>
                      <td style={{ padding: '10px' }}>{r.phone}</td>
                      <td style={{ padding: '10px', color: '#8b44db' }}>{r.course_title}</td>
                      <td style={{ padding: '10px', fontSize: '12px' }}>{new Date(r.created_at).toLocaleString('ar-EG')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. المدربين */}
      {activeTab === 'trainers' && (
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: '#2d3d52' }}>إدارة المدربين</h3>
            <button onClick={() => { resetTrainerForm(); setShowTrainerForm(true); }} disabled={showTrainerForm} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              ➕ إضافة مدرب
            </button>
          </div>

          {showTrainerForm && (
            <form onSubmit={handleSaveTrainer} style={{ backgroundColor: '#f1f5f9', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #cbd5e1' }}>
              <h4 style={{ marginTop: 0, color: '#2d3d52' }}>{editingTrainerId ? '✏️ تعديل مدرب' : '✨ إضافة مدرب'}</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                <input type="text" placeholder="اسم المدرب" value={trainerName} onChange={e => setTrainerName(e.target.value)} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                <input type="text" placeholder="التخصص" value={trainerSpecialty} onChange={e => setTrainerSpecialty(e.target.value)} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                <input type="text" placeholder="سنوات الخبرة" value={trainerExp} onChange={e => setTrainerExp(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                <input type="email" placeholder="البريد الإلكتروني" value={trainerEmail} onChange={e => setTrainerEmail(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                <input type="text" placeholder="الهاتف" value={trainerPhone} onChange={e => setTrainerPhone(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                <input type="text" placeholder="رابط الصورة (URL)" value={trainerImage} onChange={e => setTrainerImage(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <textarea placeholder="نبذة تعريفية..." value={trainerBio} onChange={e => setTrainerBio(e.target.value)} rows={2} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '15px' }}></textarea>
              <div style={{ marginBottom: '15px' }}>
                <label><input type="checkbox" checked={trainerIsActive} onChange={e => setTrainerIsActive(e.target.checked)} /> مدرب نشط</label>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" disabled={isSavingTrainer} style={{ backgroundColor: '#2d3d52', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>حفظ</button>
                <button type="button" onClick={resetTrainerForm} style={{ backgroundColor: '#94a3b8', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer' }}>إلغاء</button>
              </div>
            </form>
          )}

          {loadingTrainers ? <p>جاري التحميل...</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#2d3d52', color: '#fff', textAlign: 'right' }}>
                    <th style={{ padding: '10px' }}>الاسم</th>
                    <th style={{ padding: '10px' }}>التخصص</th>
                    <th style={{ padding: '10px' }}>الخبرة</th>
                    <th style={{ padding: '10px' }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {trainers.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>{t.name}</td>
                      <td style={{ padding: '10px', color: '#8b44db' }}>{t.specialty}</td>
                      <td style={{ padding: '10px' }}>{t.experience_years || '-'}</td>
                      <td style={{ padding: '10px', display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleEditTrainerClick(t)} style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>تعديل</button>
                        <button onClick={() => handleDeleteTrainer(t.id)} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>حذف</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4. قنوات التواصل */}
      {activeTab === 'contact' && (
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0, color: '#2d3d52' }}>إدارة بيانات التواصل والروابط</h3>
          <form onSubmit={handleSaveContact} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px', marginTop: '15px' }}>
            {Object.keys(contactData).map((key) => (
              <div key={key}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', textTransform: 'capitalize' }}>{key}:</label>
                <input 
                  type="text" 
                  value={(contactData as any)[key] || ''} 
                  onChange={e => setContactData({...contactData, [key]: e.target.value})} 
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
                />
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
              <button type="submit" disabled={isSavingContact} style={{ backgroundColor: '#2d3d52', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                حفظ بيانات التواصل
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. الرسائل الواردة */}
      {activeTab === 'messages' && (
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0, color: '#2d3d52' }}>رسائل استفسارات العملاء</h3>
          {messages.length === 0 ? <p>لا توجد رسائل.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.map(m => (
                <div key={m.id} style={{ backgroundColor: '#f1f5f9', padding: '15px', borderRadius: '8px', borderRight: '4px solid #8b44db' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <strong>{m.sender_name} ({m.sender_email})</strong>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{new Date(m.created_at).toLocaleString('ar-EG')}</span>
                  </div>
                  <p style={{ margin: 0 }}>{m.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. الإحصائيات */}
      {activeTab === 'analytics' && (
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0, color: '#2d3d52' }}>إحصائيات زيارات الموقع</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#2d3d52', color: '#fff', textAlign: 'right' }}>
                <th style={{ padding: '10px' }}>التاريخ</th>
                <th style={{ padding: '10px' }}>عدد الزيارات</th>
              </tr>
            </thead>
            <tbody>
              {analytics.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px' }}>{a.visit_date}</td>
                  <td style={{ padding: '10px', fontWeight: 'bold', color: '#8b44db' }}>{a.visitor_count} زيارة</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}