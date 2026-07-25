import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

interface EventItem {
  id: number;
  title: string;
  description: string;
  event_date: string;
  is_active: boolean;
  created_at: string;
}

interface EventsManagerProps {
  onBack?: () => void;
}

export default function EventsManager({ onBack }: EventsManagerProps) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // حالات النموذج
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const showNotification = (text: string, type: 'success' | 'error') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema('mharaty')
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('خطأ في جلب الفعاليات:', error.message);
      showNotification('خطأ في جلب الفعاليات', 'error');
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      title,
      description,
      event_date: eventDate,
      is_active: isActive,
    };

    const query = editingId
      ? supabase.schema('mharaty').from('events').update(payload).eq('id', editingId)
      : supabase.schema('mharaty').from('events').insert([payload]);

    const { error } = await query;
    setIsSaving(false);

    if (error) {
      showNotification('خطأ أثناء الحفظ: ' + error.message, 'error');
    } else {
      showNotification('✅ تم حفظ الفعالية بنجاح!', 'success');
      resetForm();
      fetchEvents();
    }
  };

  const handleEditClick = (ev: EventItem) => {
    setEditingId(ev.id);
    setTitle(ev.title);
    setDescription(ev.description || '');
    setEventDate(ev.event_date || '');
    setIsActive(ev.is_active);
    setShowForm(true);
  };

  const handleDeleteEvent = async (id: number) => {
    const { error } = await supabase.schema('mharaty').from('events').delete().eq('id', id);
    if (!error) {
      showNotification('🗑️ تم حذف الفعالية بنجاح', 'success');
      fetchEvents();
    } else {
      showNotification('خطأ أثناء الحذف', 'error');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setEventDate('');
    setIsActive(true);
    setShowForm(false);
  };

  return (
    <div style={{ direction: 'rtl', textAlign: 'right', padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Tahoma, sans-serif' }}>
      
      {/* الهيدر وزر العودة */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2d3d52', padding: '15px 25px', borderRadius: '12px', color: '#fff', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>📢 إدارة الفعاليات والأنشطة</h2>
        {onBack && (
          <button onClick={onBack} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
            ← العودة
          </button>
        )}
      </div>

      {statusMessage && (
        <div style={{ padding: '12px 20px', marginBottom: '20px', borderRadius: '8px', backgroundColor: statusMessage.type === 'success' ? '#dcfce7' : '#fee2e2', color: statusMessage.type === 'success' ? '#166534' : '#991b1b', fontWeight: 'bold' }}>
          {statusMessage.text}
        </div>
      )}

      {/* زر إضافة فاعلية جديدة */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#2d3d52', fontSize: '16px' }}>قائمة الفعاليات ({events.length})</h3>
        <button 
          onClick={() => { resetForm(); setShowForm(true); }} 
          disabled={showForm} 
          style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
        >
          ➕ إضافة فاعلية جديدة
        </button>
      </div>

      {/* نموذج الإضافة / التعديل */}
      {showForm && (
        <form onSubmit={handleSaveEvent} style={{ backgroundColor: '#f1f5f9', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #cbd5e1' }}>
          <h4 style={{ marginTop: 0, color: '#2d3d52' }}>{editingId ? '✏️ تعديل الفعالية' : '✨ إضافة فعالية جديدة'}</h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>عنوان الفعالية:</label>
              <input type="text" placeholder="مثال: ورشة عمل البرمجة" value={title} onChange={e => setTitle(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>تاريخ الفعالية:</label>
              <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>وصف الفعالية:</label>
            <textarea placeholder="تفاصيل الفعالية..." value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}></textarea>
          </div>

          <div style={{ marginBottom: '15px', fontSize: '14px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} style={{ width: '16px', height: '16px' }} />
              عرض الفعالية على الشاشة الرئيسية (نشط)
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" disabled={isSaving} style={{ backgroundColor: '#2d3d52', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              {isSaving ? 'جاري الحفظ...' : 'حفظ الفعالية'}
            </button>
            <button type="button" onClick={resetForm} style={{ backgroundColor: '#94a3b8', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer' }}>
              إلغاء
            </button>
          </div>
        </form>
      )}

      {/* جدول عرض الفعاليات */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#666', marginTop: '30px' }}>جاري التحميل... 🔄</p>
      ) : events.length === 0 ? (
        <div style={{ backgroundColor: '#fff', padding: '30px', textAlign: 'center', borderRadius: '10px', color: '#666' }}>
          <p>لا توجد أي فعاليات مضافة حتى الآن.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#2d3d52', color: '#fff', textAlign: 'right' }}>
                <th style={{ padding: '12px 15px' }}>العنوان</th>
                <th style={{ padding: '12px 15px' }}>التاريخ</th>
                <th style={{ padding: '12px 15px' }}>الحالة الرئيسية</th>
                <th style={{ padding: '12px 15px' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev, index) => (
                <tr key={ev.id || index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px 15px', fontWeight: 'bold', color: '#2d3d52' }}>{ev.title}</td>
                  <td style={{ padding: '12px 15px', color: '#475569' }}>{ev.event_date || '-'}</td>
                  <td style={{ padding: '12px 15px' }}>
                    {ev.is_active ? (
                      <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>نشط (معروض)</span>
                    ) : (
                      <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>مخفي</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 15px', display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEditClick(ev)} style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>تعديل</button>
                    <button onClick={() => handleDeleteEvent(ev.id)} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>حذف</button>
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