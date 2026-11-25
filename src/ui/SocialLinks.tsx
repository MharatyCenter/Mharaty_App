import { toWhatsAppNumber } from '../lib/validation';
import { CENTER_WHATSAPP } from '../lib/center';

interface Info { facebook?: string | null; youtube?: string | null; instagram?: string | null; telegram?: string | null; whatsapp?: string | null }

const clean = (v?: string | null) => (v ?? '').trim();
const link = (v: string, base: string) => {
  if (/^https?:\/\//i.test(v)) return v;
  if (/^(www\.|[a-z0-9.-]+\.(com|me|tv|net)\/)/i.test(v)) return 'https://' + v.replace(/^\/+/, '');
  return base + v.replace(/^@/, '').replace(/^\/+/, '');
};

const Icon = ({ children, color }: { children: React.ReactNode; color: string }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill={color} aria-hidden="true">{children}</svg>
);

/** صف أيقونات التواصل الاجتماعي: تظهر فقط الروابط المسجلة في «قنوات التواصل» */
export default function SocialLinks({ info, dark = false }: { info: Info | null; dark?: boolean }) {
  const wa = toWhatsAppNumber(clean(info?.whatsapp)) || CENTER_WHATSAPP;
  const items: { key: string; label: string; href: string; color: string; icon: React.ReactNode }[] = [];
  const fb = clean(info?.facebook), yt = clean(info?.youtube), ig = clean(info?.instagram), tg = clean(info?.telegram);
  if (fb) items.push({ key: 'fb', label: 'فيسبوك', href: link(fb, 'https://facebook.com/'), color: '#1877f2', icon: <Icon color="#1877f2"><path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21h3.1z" /></Icon> });
  if (yt) items.push({ key: 'yt', label: 'يوتيوب', href: link(yt, 'https://youtube.com/'), color: '#ff0000', icon: <Icon color="#ff0000"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4a2.5 2.5 0 0 0-1.8 1.8C2 8.800 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8C22 15.200 22 12 22 12s0-3.2-.4-4.8zM10 15V9l5.200 3L10 15z" /></Icon> });
  if (ig) items.push({ key: 'ig', label: 'إنستغرام', href: link(ig, 'https://instagram.com/'), color: '#e1306c', icon: <Icon color="#e1306c"><path d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2zm0 2A3.800 3.800 0 0 0 4 7.8v8.4A3.800 3.800 0 0 0 7.8 20h8.4a3.800 3.800 0 0 0 3.800-3.800V7.8A3.800 3.800 0 0 0 16.2 4H7.8zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm5.300-3.3a1.2 1.2 0 1 1 0 2.400 1.2 1.2 0 0 1 0-2.400z" /></Icon> });
  if (tg) items.push({ key: 'tg', label: 'تليجرام', href: link(tg, 'https://t.me/'), color: '#229ed9', icon: <Icon color="#229ed9"><path d="M21.500 4.300 2.900 11.500c-1.3.5-1.2 1.2-.2 1.500l4.8 1.500 1.8 5.600c.2.600.1.8.7.8.5 0 .7-.2 1-.5l2.300-2.200 4.8 3.500c.9.500 1.500.2 1.700-.8l3.100-14.700c.3-1.2-.5-1.8-1.400-1.400zM8.4 13.600l9.500-6c.4-.3.800-.1.500.2l-7.8 7-.3 3.100-1.900-4.300z" /></Icon> });
  if (wa) items.push({ key: 'wa', label: 'واتساب', href: `https://wa.me/${wa}`, color: '#25d366', icon: <Icon color="#25d366"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 4.900-1.3A10 10 0 1 0 12 2zm0 2a8 8 0 1 1-4.2 14.8l-.4-.2-2.800.7.8-2.700-.3-.4A8 8 0 0 1 12 4zM8.700 7.500c-.2 0-.5.100-.7.400-.3.3-.9.900-.9 2.100s.9 2.400 1 2.600c.1.2 1.8 2.800 4.400 3.800 2.200.8 2.600.7 3.100.6.500-.1 1.500-.6 1.700-1.2.2-.6.2-1.100.2-1.2-.1-.1-.2-.2-.5-.3l-1.600-.8c-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.100-.3-.1-1.100-.4-2-1.3-.8-.7-1.3-1.500-1.400-1.8-.1-.3 0-.4.100-.5l.4-.5c.1-.1.2-.3.3-.4.100-.2 0-.3 0-.5l-.7-1.8c-.2-.5-.4-.4-.6-.4z" /></Icon> });
  if (items.length === 0) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
      <span style={{ fontSize: 13, opacity: dark ? 0.85 : 1, color: dark ? '#fff' : 'var(--mh-muted)' }}>تابعنا:</span>
      {items.map((i) => (
        <a key={i.key} href={i.href} target="_blank" rel="noopener noreferrer" aria-label={i.label} title={i.label}
          style={{ width: 42, height: 42, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.18)', textDecoration: 'none' }}>
          {i.icon}
        </a>
      ))}
    </div>
  );
}
