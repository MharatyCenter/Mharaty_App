import { useEffect, useState } from 'react';

export default function OfflineBanner() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  if (online) return null;
  return (
    <div
      role="alert"
      style={{
        position: 'fixed', bottom: 'calc(12px + env(safe-area-inset-bottom))', left: '12px', right: '12px', zIndex: 3000,
        backgroundColor: '#1e293b', color: '#fff', padding: '10px 14px', borderRadius: '10px', textAlign: 'center',
        fontSize: '13px', fontWeight: 'bold', direction: 'rtl', boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
      }}
    >
      📡 لا يوجد اتصال بالإنترنت — بعض البيانات قد لا تظهر ولن يتم إرسال التسجيل حتى يعود الاتصال.
    </div>
  );
}
