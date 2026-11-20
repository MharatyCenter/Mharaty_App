import { centerWhatsAppLink } from '../lib/center';

/** زر واتساب عائم للتواصل مع المركز. يظهر فقط إذا تم ضبط VITE_CENTER_WHATSAPP في .env */
export default function WhatsAppFab({ lift = 0 }: { lift?: number }) {
  const href = centerWhatsAppLink('مرحباً، أريد الاستفسار عن كورسات مركز مهاراتي');
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label="تواصل معنا عبر واتساب"
      style={{ position: 'fixed', bottom: `calc(${18 + lift}px + env(safe-area-inset-bottom))`, left: 18, width: 54, height: 54, borderRadius: '50%', background: '#25d366', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, textDecoration: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.25)', zIndex: 900 }}>
      💬
    </a>
  );
}
