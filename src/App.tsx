import { useState } from 'react';
import HomeScreen from './HomeScreen';
import CoursesScreen from './CoursesScreen';
import TrainerPage from './Trainer';
import AdminDashboardScreen from './AdminDashboardScreen'; // 👈 استيراد لوحة التحكم الشاملة

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'courses' | 'trainer' | 'admin'>('home');
  const [selectedCategory, setSelectedCategory] = useState<'digital' | 'professional' | 'life'>('digital');
  
  // حالات نظام دخول المشرفين
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  const handleViewCategory = (category: 'digital' | 'professional' | 'life') => {
    setSelectedCategory(category);
    setCurrentScreen('courses');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === '1234') { // 👈 كلمة المرور السرية
      setIsAdminLoggedIn(true);
      setShowLoginModal(false);
      setAdminPassword('');
      setCurrentScreen('admin');
    } else {
      alert('❌ كلمة المرور غير صحيحة!');
    }
  };

  if (currentScreen === 'courses') {
    return (
      <CoursesScreen 
        currentCategory={selectedCategory} 
        onBack={handleBackToHome} 
      />
    );
  }

  if (currentScreen === 'trainer') {
    return (
      <TrainerPage onBack={handleBackToHome} />
    );
  }

  // إذا تم تسجيل الدخول كـ مشرف، تفتح لوحة التحكم الشاملة
  if (currentScreen === 'admin' && isAdminLoggedIn) {
    return (
      <AdminDashboardScreen 
        onBack={() => {
          setIsAdminLoggedIn(false);
          handleBackToHome();
        }} 
      />
    );
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      
      <HomeScreen 
        onNavigateToCategory={handleViewCategory} 
        onNavigateToTrainer={() => setCurrentScreen('trainer')} 
        onOpenAdminLogin={() => setShowLoginModal(true)} 
      />

      {/* نافذة تسجيل الدخول بكلمة المرور للمشرفين */}
      {showLoginModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '15px' }}>
          <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '12px', width: '100%', maxWidth: '350px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', border: '2px solid #2d3d52', direction: 'rtl', textAlign: 'right' }}>
            <h3 style={{ marginTop: 0, color: '#2d3d52', marginBottom: '10px' }}>🔐 لوحة تحكم الإدارة</h3>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>يرجى إدخال كلمة المرور للوصول إلى لوحة التحكم الشاملة.</p>
            
            <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input 
                type="password" 
                value={adminPassword} 
                onChange={(e) => setAdminPassword(e.target.value)} 
                placeholder="كلمة المرور..." 
                required
                autoFocus
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }} 
              />

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  type="submit" 
                  style={{ backgroundColor: '#2d3d52', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  دخول
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