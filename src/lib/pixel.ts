// بكسل فيسبوك (Meta Pixel): يُفعَّل فقط إذا وُضع VITE_FB_PIXEL_ID في إعدادات Vercel
type Fbq = ((...a: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue: unknown[][]; loaded: boolean; version: string; push: unknown };

const PIXEL_ID = String(import.meta.env.VITE_FB_PIXEL_ID || '').replace(/\D/g, '');

export function initPixel() {
  if (!PIXEL_ID || typeof window === 'undefined') return;
  const w = window as unknown as { fbq?: Fbq; _fbq?: Fbq };
  if (w.fbq) return;
  const f: Fbq = function (...args: unknown[]) {
    if (f.callMethod) f.callMethod(...args); else f.queue.push(args);
  } as Fbq;
  f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
  w.fbq = f; w._fbq = f;
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);
  f('init', PIXEL_ID);
  f('track', 'PageView');
}

/** تسجيل حدث (Lead عند تسجيل متدرب، ViewContent عند فتح كورس ...) */
export function trackPixel(event: string, data?: Record<string, unknown>) {
  try {
    const f = (window as unknown as { fbq?: Fbq }).fbq;
    if (f) f('track', event, data || {});
  } catch { /* لا نكسر التطبيق بسبب الإحصاءات */ }
}
