import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function ContactManager() {
  const [contactData, setContactData] = useState({
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchContactData();
  }, []);

  async function fetchContactData() {
    const { data } = await supabase.from('contact_info').select('*').single();
    if (data) setContactData(data);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('contact_info').upsert({ id: 1, ...contactData });
    setLoading(false);
    if (error) {
      alert('حدث خطأ أثناء الحفظ');
    } else {
      alert('تم تحديث بيانات التواصل بنجاح!');
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Cairo', direction: 'rtl', textAlign: 'right', maxWidth: '600px', margin: '0 auto' }}>
      <h2>إدارة جميع قنوات التواصل</h2>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label>رقم الهاتف:</label>
          <input type="text" value={contactData.phone} onChange={e => setContactData({...contactData, phone: e.target.value})} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div>
          <label>رابط أو رقم واتساب:</label>
          <input type="text" value={contactData.whatsapp} onChange={e => setContactData({...contactData, whatsapp: e.target.value})} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div>
          <label>رابط صفحة فيسبوك:</label>
          <input type="text" value={contactData.facebook} onChange={e => setContactData({...contactData, facebook: e.target.value})} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div>
          <label>رابط قناة يوتيوب:</label>
          <input type="text" value={contactData.youtube} onChange={e => setContactData({...contactData, youtube: e.target.value})} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div>
          <label>رابط حساب إنستغرام:</label>
          <input type="text" value={contactData.instagram} onChange={e => setContactData({...contactData, instagram: e.target.value})} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div>
          <label>رابط حساب تليجرام:</label>
          <input type="text" value={contactData.telegram} onChange={e => setContactData({...contactData, telegram: e.target.value})} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div>
          <label>البريد الإلكتروني:</label>
          <input type="email" value={contactData.email} onChange={e => setContactData({...contactData, email: e.target.value})} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div>
          <label>رابط الموقع الإلكتروني:</label>
          <input type="text" value={contactData.website} onChange={e => setContactData({...contactData, website: e.target.value})} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div>
          <label>العنوان (أسوان):</label>
          <input type="text" value={contactData.address} onChange={e => setContactData({...contactData, address: e.target.value})} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div>
          <label>ساعات العمل:</label>
          <input type="text" value={contactData.working_hours} onChange={e => setContactData({...contactData, working_hours: e.target.value})} style={{ width: '100%', padding: '8px' }} />
        </div>
        <button type="submit" disabled={loading} style={{ background: '#3b82f6', color: 'white', padding: '12px', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderRadius: '6px' }}>
          {loading ? 'جاري الحفظ...' : 'حفظ كل التغييرات'}
        </button>
      </form>
    </div>
  );
}