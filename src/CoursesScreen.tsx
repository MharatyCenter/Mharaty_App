import React, { useEffect, useState } from 'react';
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
  progress_percentage: number;
  trainees_performance: string;
  month_1: boolean;
  month_2: boolean;
  month_3: boolean;
}

interface CoursesScreenProps {
  currentCategory: 'digital' | 'professional' | 'life';
  onBack: () => void;
}

export default function CoursesScreen({ currentCategory, onBack }: CoursesScreenProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // حالات النموذج
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [instructor, setInstructor] = useState('');
  const [duration, setDuration] = useState('');
  const [level, setLevel] = useState('مبتدئ');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'digital' | 'professional' | 'life'>(currentCategory);
  const [isActive, setIsActive] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [traineesPerformance, setTraineesPerformance] = useState('');
  
  // الحقول الثلاثة الجديدة للخطة
  const [month1, setMonth1] = useState(false);
  const [month2, setMonth2] = useState(false);
  const [month3, setMonth3] = useState(false);

  const categoryNames = {
    digital: 'المهارات الرقمية',
    professional: 'المهارات المهنية',
    life: 'المهارات الحياتية'
  };

  useEffect(() => {
    fetchCourses();
    setSelectedCourse(null);
    setIsFormOpen(false);
    setCategory(currentCategory);
  }, [currentCategory]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('category', currentCategory);

      if (error) {
        console.error('خطأ:', error.message);
      } else {
        setCourses(data || []);
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
    setTitle('');
    setInstructor('');
    setDuration('');
    setLevel('مبتدئ');
    setDescription('');
    setCategory(currentCategory);
    setIsActive(false);
    setProgressPercentage(0);
    setTraineesPerformance('');
    setMonth1(false);
    setMonth2(false);
    setMonth3(false);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (course: Course, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(course.id);
    setTitle(course.title);
    setInstructor(course.instructor);
    setDuration(course.duration);
    setLevel(course.level);
    setDescription(course.description || '');
    setCategory(course.category);
    setIsActive(Boolean(course.is_active));
    setProgressPercentage(course.progress_percentage || 0);
    setTraineesPerformance(course.trainees_performance || '');
    setMonth1(Boolean(course.month_1));
    setMonth2(Boolean(course.month_2));
    setMonth3(Boolean(course.month_3));
    setIsFormOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !instructor) {
      alert('يرجى إدخال اسم الكورس والمدرب على الأقل');
      return;
    }

    const courseData = {
      title,
      instructor,
      duration,
      level,
      description,
      category,
      is_active: Boolean(isActive),
      progress_percentage: Number(progressPercentage || 0),
      trainees_performance: traineesPerformance || '',
      month_1: Boolean(month1),
      month_2: Boolean(month2),
      month_3: Boolean(month3)
    };

    if (editingId) {
      const { error } = await supabase
        .from('courses')
        .update(courseData)
        .eq('id', editingId);

      if (error) {
        alert('حدث خطأ أثناء التعديل: ' + error.message);
      } else {
        setIsFormOpen(false);
        fetchCourses();
      }
    } else {
      const { error } = await supabase
        .from('courses')
        .insert([courseData]);

      if (error) {
        alert('حدث خطأ أثناء الإضافة: ' + error.message);
      } else {
        setIsFormOpen(false);
        fetchCourses();
      }
    }
  };

  const handleDeleteCourse = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('هل أنت متأكد من حذف هذا الكورس؟')) {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) {
        alert('حدث خطأ أثناء الحذف: ' + error.message);
      } else {
        fetchCourses();
      }
    }
  };

  if (selectedCourse) {
    return (
      <div style={{ direction: 'rtl', textAlign: 'right', padding: '20px', backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', backgroundColor: '#2d3d52', padding: '15px 20px', borderRadius: '10px', color: '#fff' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>📖 تفاصيل الكورس</h2>
          <button onClick={() => setSelectedCourse(null)} style={{ backgroundColor: '#8b44db', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>العودة لجدول الدورات</button>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '10px', boxShadow: '0 3px 10px rgba(0,0,0,0.06)' }}>
          <h1 style={{ color: '#2d3d52', marginTop: 0, marginBottom: '20px' }}>{selectedCourse.title}</h1>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', flexWrap: 'wrap' }}>
            <span style={{ backgroundColor: '#f3e8ff', color: '#8b44db', padding: '6px 15px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>📊 المستوى: {selectedCourse.level}</span>
            <span style={{ backgroundColor: '#e2e8f0', color: '#334155', padding: '6px 15px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>⏱️ المدة: {selectedCourse.duration}</span>
            <span style={{ backgroundColor: '#e2e8f0', color: '#334155', padding: '6px 15px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>👨‍🏫 المدرب: {selectedCourse.instructor}</span>
            <span style={{ backgroundColor: '#e2e8f0', color: '#334155', padding: '6px 15px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>📂 القسم: {categoryNames[selectedCourse.category]}</span>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '20px 0' }} />
          <h3 style={{ color: '#2d3d52', fontSize: '18px' }}>وصف الكورس:</h3>
          <p style={{ color: '#555', fontSize: '16px', lineHeight: '1.8' }}>{selectedCourse.description}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ direction: 'rtl', textAlign: 'right', padding: '20px', backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', backgroundColor: '#2d3d52', padding: '15px 20px', borderRadius: '10px', color: '#fff', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ margin: 0, fontSize: '20px' }}>📚 دورات {categoryNames[currentCategory]}</h2>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={toggleAdminMode} style={{ backgroundColor: isAdmin ? '#ef4444' : '#475569', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
            {isAdmin ? '🔒 خروج المشرف' : '🔑 دخول المشرف'}
          </button>

          {isAdmin && (
            <button onClick={handleOpenAddForm} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              ➕ إضافة كورس جديد
            </button>
          )}

          <button onClick={onBack} style={{ backgroundColor: '#8b44db', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            عودة للرئيسية
          </button>
        </div>
      </div>

      {isAdmin && isFormOpen && (
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', marginBottom: '25px', boxShadow: '0 3px 10px rgba(0,0,0,0.08)', border: '2px solid #8b44db' }}>
          <h3 style={{ marginTop: 0, color: '#2d3d52' }}>{editingId ? '✏️ تعديل بيانات الكورس' : '➕ إضافة كورس جديد'}</h3>
          <form onSubmit={handleSaveCourse} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>اسم الكورس:</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>اسم المدرب:</label>
                <input type="text" value={instructor} onChange={(e) => setInstructor(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>المدة:</label>
                <input type="text" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="مثال: 4 أسابيع" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>المستوى:</label>
                <select value={level} onChange={(e) => setLevel(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}>
                  <option value="مبتدئ">مبتدئ</option>
                  <option value="متوسط">متوسط</option>
                  <option value="متقدم">متقدم</option>
                </select>
              </div>
            </div>

            {/* خانات التفعيل والخطة */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#2d3d52' }}>إعدادات العرض:</label>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', color: '#065f46' }}>
                  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                  كورس نشط حالياً (في الواجهة)
                </label>
              </div>

              <div style={{ marginTop: '5px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '8px' }}>إدراج الكورس ضمن خطة الربع الحالي (يمكن اختياره لأكثر من شهر):</span>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                    <input type="checkbox" checked={month1} onChange={(e) => setMonth1(e.target.checked)} style={{ width: '15px', height: '15px' }} />
                    الشهر الأول
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                    <input type="checkbox" checked={month2} onChange={(e) => setMonth2(e.target.checked)} style={{ width: '15px', height: '15px' }} />
                    الشهر الثاني
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                    <input type="checkbox" checked={month3} onChange={(e) => setMonth3(e.target.checked)} style={{ width: '15px', height: '15px' }} />
                    الشهر الثالث
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>وصف الكورس:</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}></textarea>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={{ backgroundColor: '#8b44db', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>💾 حفظ</button>
              <button type="button" onClick={() => setIsFormOpen(false)} style={{ backgroundColor: '#64748b', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {/* الجدول */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#666', fontSize: '16px', marginTop: '50px' }}>جاري التحميل... 🔄</p>
      ) : courses.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '80px', color: '#666' }}>
          <p style={{ fontSize: '16px' }}>لا توجد دورات مضافة في هذا القسم حالياً.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 3px 10px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ backgroundColor: '#2d3d52', color: '#fff', fontSize: '14px' }}>
                <th style={{ padding: '12px 15px' }}>اسم الكورس</th>
                <th style={{ padding: '12px 15px' }}>الحالة</th>
                <th style={{ padding: '12px 15px' }}>الخطة (أشهر)</th>
                <th style={{ padding: '12px 15px' }}>المدرب</th>
                <th style={{ padding: '12px 15px' }}>المستوى</th>
                {isAdmin && <th style={{ padding: '12px 15px', textAlign: 'center' }}>الإجراءات</th>}
              </tr>
            </thead>
            <tbody>
              {courses.map((course, index) => (
                <tr key={course.id} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '12px 15px' }}>
                    <span onClick={() => setSelectedCourse(course)} style={{ fontWeight: 'bold', color: '#8b44db', cursor: 'pointer', textDecoration: 'underline' }}>
                      {course.title}
                    </span>
                  </td>
                  <td style={{ padding: '12px 15px' }}>
                    {course.is_active ? (
                      <span style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>نشط</span>
                    ) : (
                      <span style={{ backgroundColor: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '20px', fontSize: '12px' }}>عادي</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 15px', fontSize: '12px', color: '#475569' }}>
                    {course.month_1 && <span style={{ backgroundColor: '#f3e8ff', color: '#8b44db', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px' }}>ش1</span>}
                    {course.month_2 && <span style={{ backgroundColor: '#fae8ff', color: '#a855f7', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px' }}>ش2</span>}
                    {course.month_3 && <span style={{ backgroundColor: '#e2e8f0', color: '#334155', padding: '2px 6px', borderRadius: '4px' }}>ش3</span>}
                    {!course.month_1 && !course.month_2 && !course.month_3 && <span style={{ color: '#aaa' }}>غير مدرج</span>}
                  </td>
                  <td style={{ padding: '12px 15px', color: '#666' }}>{course.instructor}</td>
                  <td style={{ padding: '12px 15px' }}>
                    <span style={{ backgroundColor: '#f3e8ff', color: '#8b44db', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                      {course.level}
                    </span>
                  </td>
                  
                  {isAdmin && (
                    <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        <button onClick={(e) => handleOpenEditForm(course, e)} style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>تعديل</button>
                        <button onClick={(e) => handleDeleteCourse(course.id, e)} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>حذف</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}