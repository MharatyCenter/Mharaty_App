import { useEffect, useState } from 'react';
import HomeScreen from './HomeScreen';
import CoursesScreen from './CoursesScreen';
import TrainerPage from './Trainer';
import AboutScreen from './AboutScreen';
import AdminDashboardScreen from './AdminDashboardScreen';
import { supabase } from './supabaseClient';
import { useToast } from './ui/Toast';
import { dropLayers, useBackClose } from './ui/useBackClose';
import WhatsAppFab from './ui/WhatsAppFab';
import { useIsMobile } from './ui/useIsMobile';

type Screen = 'home' | 'courses' | 'trainer' | 'about' | 'admin';

export default function App() {
  const toast = useToast();
  const isMobile = useIsMobile();
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedCategory, setSelectedCategory] = useState<'digital' | 'professional' | 'life'>('digital');

  // نظام دخول المشرفين (Supabase Auth - بريد وكلمة مرور حقيقيين)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // استرجاع جلسة المشرف إن وُجدت، ومتابعة تغيّرها (انتهاء الصلاحية / تسجيل الخروج)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setIsAdminLoggedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdminLoggedIn(!!session);
      if (!session) setCurrentScreen((s) => (s === 'admin' ? 'home' : s));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // التنقل مع سجل المتصفح، فيعمل زر الرجوع في أندرويد بدل إغلاق التطبيق
  useEffect(() => {
    history.replaceState({ screen: 'home' }, '');
    const onPop = () => setCurrentScreen((history.state?.screen as Screen) || 'home');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (screen: Screen) => {
    history.pushState({ screen }, '');
    setCurrentScreen(screen);
  };

  useBackClose(showLoginModal, () => { setShowLoginModal(false); setAdminPassword(''); });

  const handleViewCategory = (category: 'digital' | 'professional' | 'life') => {
    setSelectedCategory(category);
    navigate('courses');
  };

  const handleBackToHome = () => {
    if (history.state?.screen && history.state.screen !== 'home') history.back();
    else setCurrentScreen('home');
  };

  const handleOpenAdmin = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      navigate('admin');
    } else {
      setShowLoginModal(true);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningIn(true);
    const { error } = await supabase.auth.signInWithPassword({ email: adminEmail.trim(), password: adminPassword.trim() });
    setIsSigningIn(false);

    if (error) {
      console.error('خطأ تسجيل الدخول:', error);
      const msg = error.message || '';
      if (/invalid login credentials/i.test(msg)) {
        toast.error('البريد أو كلمة المرور غير مطابقين. المشروع المتصل: ' + new URL(import.meta.env.VITE_SUPABASE_URL).host.split('.')[0]);
      } else if (/email not confirmed/i.test(msg)) {
        toast.error('المستخدم غير مفعّل: من Supabase افتح Authentication > Users واضغط على المستخدم ثم Confirm email.');
      } else if (/fetch|network|failed/i.test(msg)) {
        toast.error('تعذر الاتصال بـ Supabase. تأكد من VITE_SUPABASE_URL في ملف .env وأعد تشغيل التطبيق.');
      } else {
        toast.error('خطأ: ' + msg);
      }
      return;
    }
    setAdminPassword('');
    dropLayers(); // خطوة النافذة في السجل تصبح شاشة الإدارة
    history.replaceState({ screen: 'admin' }, '');
    setCurrentScreen('admin');
    setShowLoginModal(false);
    toast.success('تم تسجيل الدخول بنجاح');
  };

  const handleAdminLogout = async () => {
    await supabase.auth.signOut();
    history.replaceState({ screen: 'home' }, '');
    setCurrentScreen('home');
  };

  if (currentScreen === 'courses') {
    return (<><CoursesScreen currentCategory={selectedCategory} onBack={handleBackToHome} /><WhatsAppFab /></>);
  }

  if (currentScreen === 'trainer') {
    return <TrainerPage onBack={handleBackToHome} />;
  }

  if (currentScreen === 'about') {
    return (<><AboutScreen onBack={handleBackToHome} /><WhatsAppFab /></>);
  }

  if (currentScreen === 'admin' && isAdminLoggedIn) {
    return <AdminDashboardScreen onBack={handleAdminLogout} />;
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none',
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <HomeScreen
        onNavigateToCategory={handleViewCategory}
        onNavigateToTrainer={() => navigate('trainer')}
        onNavigateToAbout={() => navigate('about')}
        onOpenAdminLogin={handleOpenAdmin}
      />

      <WhatsAppFab lift={isMobile ? 62 : 0} />

      {/* نافذة تسجيل دخول المشرفين */}
      {showLoginModal && (
        <div
          onClick={() => setShowLoginModal(false)}
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '15px' }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="تسجيل دخول الإدارة"
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '12px', width: '100%', maxWidth: '350px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', border: '2px solid #2d3d52', direction: 'rtl', textAlign: 'right' }}
          >
            <h3 style={{ marginTop: 0, color: '#2d3d52', marginBottom: '10px' }}>🔐 لوحة تحكم الإدارة</h3>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>سجّل الدخول ببريد المشرف وكلمة المرور للوصول إلى لوحة التحكم.</p>

            <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="البريد الإلكتروني"
                autoComplete="off"
                required
                autoFocus
                style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="كلمة المرور"
                autoComplete="off"
                required
                style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }}
              />
              <label style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
                إظهار كلمة المرور
              </label>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={isSigningIn}
                  style={{ backgroundColor: '#2d3d52', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', opacity: isSigningIn ? 0.7 : 1 }}
                >
                  {isSigningIn ? 'جاري الدخول...' : 'دخول'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowLoginModal(false); setAdminPassword(''); }}
                  style={{ backgroundColor: '#cbd5e1', color: '#334155', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
