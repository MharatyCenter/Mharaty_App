import { formatArabicDate } from '../lib/messages';

export interface FeaturedCourse {
  id: number;
  title: string;
  instructor: string;
  duration: string;
  category: 'digital' | 'professional' | 'life';
  fee?: number | null;
  start_date?: string | null;
  image_url?: string | null;
}

const CAT: Record<string, { icon: string; grad: string }> = {
  digital: { icon: '💻', grad: 'linear-gradient(135deg, #2d3d52, #8b44db)' },
  professional: { icon: '👔', grad: 'linear-gradient(135deg, #8b44db, #b967ff)' },
  life: { icon: '🌱', grad: 'linear-gradient(135deg, #2d3d52, #10b981)' },
};

/** شريط أفقي قابل للسحب بالإصبع للدورات المتاحة الآن، مع بطاقة بديلة للدورة التي بلا صورة */
export default function FeaturedCourses({ courses, loading, onOpen }: { courses: FeaturedCourse[]; loading: boolean; onOpen: (c: FeaturedCourse) => void }) {
  if (!loading && courses.length === 0) return null;
  return (
    <section aria-label="الدورات المتاحة الآن" style={{ marginBottom: 32 }}>
      <h2 style={{ color: 'var(--mh-navy)', fontSize: 18, margin: '0 0 12px', borderBottom: '2px solid #10b981', paddingBottom: 5, width: 'fit-content' }}>⚡ الدورات المتاحة الآن</h2>
      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', scrollSnapType: 'x mandatory', margin: '0 -15px', padding: '0 15px 10px', scrollPaddingInline: 15, WebkitOverflowScrolling: 'touch' }}>
        {loading
          ? [0, 1, 2].map((i) => <div key={i} aria-hidden="true" style={{ flex: '0 0 250px', height: 270, borderRadius: 14, background: '#e2e8f0', animation: 'mh-pulse 1.2s ease infinite' }} />)
          : courses.map((c) => {
              const cat = CAT[c.category] || CAT.digital;
              return (
                <article key={c.id} style={{ flex: '0 0 250px', scrollSnapAlign: 'start', background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--mh-shadow)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ position: 'relative', height: 130, background: cat.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44 }}>
                    {c.image_url ? <img src={c.image_url} alt={c.title} loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} /> : null}
                    <span aria-hidden="true">{cat.icon}</span>
                    <span style={{ position: 'absolute', top: 10, right: 10, background: '#10b981', color: '#fff', fontSize: 11, padding: '3px 8px', borderRadius: 20, fontWeight: 'bold' }}>جاري الآن</span>
                  </div>
                  <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: 15, color: 'var(--mh-navy)', lineHeight: 1.5 }}>{c.title}</h3>
                    <div style={{ fontSize: 12, color: 'var(--mh-muted)' }}>👨‍🏫 {c.instructor || 'غير محدد'}{c.duration ? ` · ⏳ ${c.duration}` : ''}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: 12, fontWeight: 'bold', minHeight: 24 }}>
                      {c.fee ? <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 9px', borderRadius: 20 }}>💰 {c.fee} جنيه</span> : null}
                      {c.start_date ? <span style={{ background: '#fef3c7', color: '#b45309', padding: '3px 9px', borderRadius: 20 }}>🚀 {formatArabicDate(c.start_date)}</span> : null}
                    </div>
                    <button onClick={() => onOpen(c)} style={{ marginTop: 'auto', background: 'var(--mh-primary)', color: '#fff', border: 'none', padding: 10, borderRadius: 10, fontWeight: 'bold', cursor: 'pointer', fontSize: 14 }}>التفاصيل والتسجيل</button>
                  </div>
                </article>
              );
            })}
      </div>
    </section>
  );
}
