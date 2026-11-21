import { useState } from 'react';
import { useBackClose } from './useBackClose';

/** عرض الصور بملء الشاشة مع تنقل بين الصور */
export default function ImageLightbox({ images, start, onClose }: { images: string[]; start: number | null; onClose: () => void }) {
  const open = start !== null;
  useBackClose(open, onClose);
  const [idx, setIdx] = useState(0);
  const [lastStart, setLastStart] = useState<number | null>(null);
  if (start !== lastStart) { setLastStart(start); if (start !== null) setIdx(start); }
  if (!open || images.length === 0) return null;
  const go = (d: number) => setIdx((i) => (i + d + images.length) % images.length);
  const nav: React.CSSProperties = { position: 'absolute', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', width: 44, height: 44, borderRadius: '50%', fontSize: 22, cursor: 'pointer' };
  return (
    <div onClick={onClose} role="dialog" aria-modal="true" aria-label="عرض الصورة" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img src={images[idx]} alt="" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '96vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 8 }} />
      <button type="button" aria-label="إغلاق" onClick={onClose} style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', width: 40, height: 40, borderRadius: '50%', fontSize: 20, cursor: 'pointer' }}>✕</button>
      {images.length > 1 && (
        <>
          <button type="button" aria-label="التالية" onClick={(e) => { e.stopPropagation(); go(1); }} style={{ ...nav, left: 12 }}>‹</button>
          <button type="button" aria-label="السابقة" onClick={(e) => { e.stopPropagation(); go(-1); }} style={{ ...nav, right: 12 }}>›</button>
          <div style={{ position: 'absolute', bottom: 16, color: '#fff', fontSize: 13 }}>{idx + 1} / {images.length}</div>
        </>
      )}
    </div>
  );
}
