import { centerWhatsAppLink } from './lib/center';

interface Track { title: string; sub: string; color: string; items: [string, string][] }

const TRACKS: Track[] = [
  { title: 'المهارات الرقمية', sub: 'لقيادة المستقبل الرقمي وإتقان أدوات التكنولوجيا الحديثة.', color: '#2d3d52', items: [
    ['الشبكات والبنية التحتية', 'أساسيات وهندسة الشبكات، أكاديمية معتمدة من Cisco.'],
    ['الذكاء الاصطناعي', 'تطبيقاته في الأعمال وأدوات الإنتاجية الحديثة.'],
    ['البرمجة وتطوير البرمجيات', 'أساسيات البرمجة، لغة Python، وتطوير التطبيقات.'],
    ['الأمن السيبراني', 'حماية البيانات، أمن الشبكات، وأساسيات الدفاع السيبراني.'],
    ['تطبيقات أوفيس في بيئة العمل', 'Excel وWord وPowerPoint للإدارة والمحاسبة وتحليل البيانات.'],
    ['مهاراتي جونيور', 'الروبوتكس والبرمجة المبسطة للأطفال والشباب: Scratch وArduino وMicro:bit.'],
  ] },
  { title: 'المهارات الحياتية والشخصية', sub: 'لتعزيز حضورك وفاعليتك في بيئة العمل.', color: '#e8a92b', items: [
    ['إدارة الوقت والأولويات', 'تقنيات التنظيم وزيادة الإنتاجية الشخصية والمهنية.'],
    ['التواصل الفعال', 'الإقناع والتفاوض وبناء العلاقات المهنية الناجحة.'],
    ['التخطيط الاستراتيجي والتشغيلي', 'وضع الأهداف وإدارة المشاريع واتخاذ القرارات.'],
    ['مهارات العرض والتقديم', 'فن الإلقاء وتصميم العروض المؤثرة والتحدث أمام الجمهور بثقة.'],
    ['إعداد المدربين المحترفين (TOT)', 'تأهيل الكوادر التدريبية بأحدث أساليب التدريب التفاعلي.'],
  ] },
  { title: 'المهارات المهنية والحرفية', sub: 'حرفة تقنية تفتح لك العمل الحر أو التوظيف الفوري.', color: '#b8573a', items: [
    ['صيانة الهواتف الذكية', 'هاردوير وسوفتوير بأحدث الأجهزة.'],
    ['صيانة الشاشات والأجهزة الإلكترونية', 'تشخيص الأعطال وإصلاح الشاشات والرسيفرات.'],
    ['صيانة الحاسبات', 'تجميع وصيانة أجهزة الكمبيوتر واللاب توب.'],
    ['أنظمة المراقبة والأمان', 'تركيب وبرمجة شبكات كاميرات المراقبة.'],
    ['تركيب وتمديد الشبكات', 'تنفيذ عملي لشبكات الإنترنت والربط الداخلي للمؤسسات.'],
    ['التصوير الفوتوغرافي للمنتجات', 'الإضاءة والتصوير التجاري وصور احترافية للتسويق الإلكتروني.'],
  ] },
];

const SERVICES: [string, string][] = [
  ['الاستشارات التدريبية والتطوير المؤسسي', 'تصميم حقائب تدريبية مخصصة للشركات والمؤسسات والجمعيات الأهلية.'],
  ['مساحات العمل المشتركة', 'Mharaty Workspace: قاعات مكيفة وطاولات مستديرة للعمل الحر والاجتماعات ومناقشة مشاريع التخرج لطلاب الجامعات.'],
  ['تأجير المعامل والقاعات', 'معمل حاسب آلي بـ 18 جهازاً مرتبطة بشبكة تحكم تعليمي، متاح لاستضافة الدورات وورش العمل.'],
];

const WHY: [string, string][] = [
  ['اعتماد دولي', 'أكاديمية معتمدة من شركة Cisco العالمية.'],
  ['شمولية التدريب', 'المهارة التقنية والحرفية والشخصية تحت سقف واحد.'],
  ['تطبيق عملي مكثف', 'معامل وورش عمل مجهزة بالكامل لاكتساب خبرة يدوية حقيقية.'],
  ['مدربون واستشاريون محترفون', 'نخبة من الخبراء الممارسين في مجالاتهم.'],
];

const card: React.CSSProperties = { background: '#fff', border: '1px solid var(--mh-border)', borderRadius: 12, padding: 18 };
const h2: React.CSSProperties = { color: 'var(--mh-navy)', fontSize: 20, margin: '0 0 12px', borderBottom: '2px solid var(--mh-primary)', paddingBottom: 6, width: 'fit-content' };

export default function AboutScreen({ onBack }: { onBack: () => void }) {
  const wa = centerWhatsAppLink('مرحباً، أريد الاستفسار عن مركز مهاراتي');
  return (
    <div style={{ direction: 'rtl', textAlign: 'right', background: 'var(--mh-bg)', minHeight: '100vh', paddingBottom: 40 }}>
      <div style={{ background: 'linear-gradient(135deg, #2d3d52 60%, #8b44db 100%)', color: '#fff', padding: '18px 16px 28px', borderBottom: '6px solid #e8a92b' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <button type="button" onClick={onBack} style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', marginBottom: 14 }}>← رجوع</button>
          <h1 style={{ margin: 0, fontSize: 'clamp(22px, 6vw, 34px)', lineHeight: 1.4 }}>مركز مهاراتي للتدريب والاستشارات</h1>
          <div dir="ltr" style={{ opacity: 0.8, fontSize: 14, margin: '4px 0 12px', textAlign: 'right' }}>MHARATY Training &amp; Consulting</div>
          <p style={{ margin: 0, maxWidth: 640, lineHeight: 1.9, fontSize: 15 }}>مؤسسة تدريبية واستشارية في مدينة أسوان، تجمع المعرفة التقنية والمهارات الشخصية والخبرة الحرفية في مكان واحد.</p>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '22px 16px 0' }}>
        <h2 style={h2}>من نحن</h2>
        <p style={{ lineHeight: 2, color: '#334155', margin: '0 0 20px' }}>
          نؤمن في «مهاراتي» بأن النجاح في سوق العمل المعاصر يحتاج إلى مزيج متكامل من المعرفة التقنية والمهارات الشخصية والخبرة الحرفية التطبيقية. نعمل على تمكين الشباب والطلاب والخريجين ورواد الأعمال من خلال منظومة تدريبية شاملة تجمع بين التكنولوجيا الحديثة والتطبيق العملي المباشر، في بيئة محفزة ومجهزة بأحدث الإمكانيات.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 28 }}>
          {[['🔭 رؤيتنا', 'أن نكون المرجع الأول للتدريب والاستشارات في صعيد مصر، ونموذجاً رائداً في تأهيل كوادر بشرية متكاملة المهارات وقادرة على المنافسة محلياً ودولياً.'],
            ['🎯 رسالتنا', 'تقديم حلول تدريبية واستشارية عالية الجودة تركز على الجانب التطبيقي والعملي، لسد الفجوة بين التعليم الأكاديمي ومتطلبات سوق العمل المتغيرة باستمرار.']].map(([t, p]) => (
            <div key={t} style={{ ...card, borderRight: '5px solid #e8a92b' }}>
              <h3 style={{ margin: '0 0 6px', color: 'var(--mh-navy)' }}>{t}</h3>
              <p style={{ margin: 0, color: 'var(--mh-muted)', lineHeight: 1.9, fontSize: 14 }}>{p}</p>
            </div>
          ))}
        </div>

        <h2 style={h2}>محاورنا وبرامجنا التدريبية</h2>
        <p style={{ color: '#334155', margin: '0 0 14px' }}>منهجيتنا ترتكز على ثلاثة محاور رئيسية لبناء مسار مهني متوازن.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 14, marginBottom: 28 }}>
          {TRACKS.map((t) => (
            <article key={t.title} style={{ ...card, borderTop: `5px solid ${t.color}` }}>
              <h3 style={{ margin: 0, color: 'var(--mh-navy)', fontSize: 18 }}>{t.title}</h3>
              <p style={{ color: 'var(--mh-muted)', fontSize: 13, margin: '4px 0 10px' }}>{t.sub}</p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {t.items.map(([a, b]) => (
                  <li key={a} style={{ padding: '8px 0', borderTop: '1px solid var(--mh-border)', lineHeight: 1.7 }}>
                    <b style={{ display: 'block', fontSize: 14 }}>{a}</b>
                    <span style={{ color: 'var(--mh-muted)', fontSize: 13 }}>{b}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <h2 style={h2}>خدماتنا الاستشارية ومساحات العمل</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 28 }}>
          {SERVICES.map(([a, b]) => (
            <div key={a} style={{ ...card, borderTop: '3px solid var(--mh-navy)' }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 16, color: 'var(--mh-navy)' }}>{a}</h3>
              <p style={{ margin: 0, color: 'var(--mh-muted)', fontSize: 13, lineHeight: 1.8 }}>{b}</p>
            </div>
          ))}
        </div>

        <h2 style={h2}>لماذا مهاراتي؟</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 28 }}>
          {WHY.map(([a, b]) => (
            <div key={a} style={{ ...card, borderRight: '5px solid #2f7d5b' }}>
              <b style={{ display: 'block', color: 'var(--mh-navy)' }}>{a}</b>
              <span style={{ color: 'var(--mh-muted)', fontSize: 13 }}>{b}</span>
            </div>
          ))}
        </div>

        <div style={{ background: '#2d3d52', color: '#fff', borderRadius: 14, padding: 20 }}>
          <h2 style={{ margin: '0 0 8px', color: '#e8a92b', fontSize: 20 }}>الموقع والتواصل</h2>
          <p style={{ margin: '0 0 14px', lineHeight: 1.9 }}>📍 حي الشيخ هارون، بجوار إدارة مرور أسوان، داخل مبنى جمعية عيد الأم للتنمية، مدينة أسوان.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {wa && <a href={wa} target="_blank" rel="noopener noreferrer" style={{ background: '#25d366', color: '#fff', padding: '10px 18px', borderRadius: 10, fontWeight: 'bold', textDecoration: 'none' }}>💬 تواصل عبر واتساب</a>}
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('جمعية عيد الأم للتنمية أسوان')}`} target="_blank" rel="noopener noreferrer" style={{ background: '#fff', color: '#2d3d52', padding: '10px 18px', borderRadius: 10, fontWeight: 'bold', textDecoration: 'none' }}>🗺️ افتح الموقع على الخريطة</a>
          </div>
        </div>
      </div>
    </div>
  );
}
