import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function ContactScreen() {
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

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase.from('contact_info').select('*').single();
      if (data) setContactData(data);
    }
    loadData();
  }, []);

  return (
    <div style={{ maxWidth: '850px', margin: '40px auto', padding: '20px', fontFamily: 'Cairo', direction: 'rtl', textAlign: 'right' }}>
      <div style={{ textAlign: 'center', marginBottom: '35px' }}>
        <h2 style={{ color: '#2c3e50', fontSize: '28px' }}>تواصل معنا</h2>
        <p style={{ color: '#7f8c8d', fontSize: '16px' }}>يسعدنا التواصل معك عبر أي من قنواتنا الرسمية في أسوان.</p>
      </div>

      <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {contactData.address && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>📍</span>
            <div>
              <strong>العنوان:</strong>
              <p style={{ margin: '3px 0 0 0', color: '#555' }}>{contactData.address}</p>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactData.address)}`} 
                target="_blank" 
                rel="noreferrer" 
                style={{ fontSize: '13px', color: '#3b82f6', textDecoration: 'underline', display: 'inline-block', marginTop: '4px' }}
              >
                فتح الموقع الجغرافي على خرائط جوجل
              </a>
            </div>
          </div>
        )}

        {contactData.phone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>📞</span>
            <div>
              <strong>الهاتف:</strong>
              <p style={{ margin: '3px 0 0 0', color: '#555' }}>{contactData.phone}</p>
            </div>
          </div>
        )}

        {contactData.whatsapp && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>💬</span>
            <div>
              <strong>واتساب:</strong>
              <p style={{ margin: '3px 0 0 0' }}><a href={contactData.whatsapp} target="_blank" rel="noreferrer" style={{ color: '#25D366', textDecoration: 'none' }}>تواصل عبر واتساب</a></p>
            </div>
          </div>
        )}

        {contactData.facebook && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>👥</span>
            <div>
              <strong>فيسبوك:</strong>
              <p style={{ margin: '3px 0 0 0' }}><a href={contactData.facebook} target="_blank" rel="noreferrer" style={{ color: '#1877F2', textDecoration: 'none' }}>زيارة صفحة الفيسبوك</a></p>
            </div>
          </div>
        )}

        {contactData.youtube && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>📺</span>
            <div>
              <strong>يوتيوب:</strong>
              <p style={{ margin: '3px 0 0 0' }}><a href={contactData.youtube} target="_blank" rel="noreferrer" style={{ color: '#FF0000', textDecoration: 'none' }}>قناة اليوتيوب</a></p>
            </div>
          </div>
        )}

        {contactData.instagram && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>📸</span>
            <div>
              <strong>إنستغرام:</strong>
              <p style={{ margin: '3px 0 0 0' }}><a href={contactData.instagram} target="_blank" rel="noreferrer" style={{ color: '#E1306C', textDecoration: 'none' }}>حساب الإنستغرام</a></p>
            </div>
          </div>
        )}

        {contactData.telegram && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>✈️</span>
            <div>
              <strong>تليجرام:</strong>
              <p style={{ margin: '3px 0 0 0' }}><a href={contactData.telegram} target="_blank" rel="noreferrer" style={{ color: '#0088cc', textDecoration: 'none' }}>قناة/حساب تليجرام</a></p>
            </div>
          </div>
        )}

        {contactData.email && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>✉️</span>
            <div>
              <strong>البريد الإلكتروني:</strong>
              <p style={{ margin: '3px 0 0 0', color: '#555' }}>{contactData.email}</p>
            </div>
          </div>
        )}

      </div>

      {contactData.working_hours && (
        <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>ساعات العمل:</h4>
          <p style={{ margin: '0', color: '#666' }}>{contactData.working_hours}</p>
        </div>
      )}
    </div>
  );
}