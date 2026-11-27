import { useBackClose } from './useBackClose';

interface Props { open: boolean; onClose: () => void; }

const SECTIONS: { title: string; body: string[] }[] = [
  { title: 'البيانات التي نجمعها', body: [
    'عند التسجيل في كورس: الاسم، الرقم القومي، رقم الواتساب، البريد الإلكتروني (اختياري)، العنوان، نوع التدريب، المؤهل الدراسي، جهة العمل والوظيفة (اختياريان).',
    'عند زيارة التطبيق: بيانات تقنية للإحصاء فقط (نوع الجهاز والمتصفح والصفحة المفتوحة وعنوان الإنترنت IP).',
  ] },
  { title: 'لماذا نجمعها', body: [
    'لتسجيلك في الكورس، والتواصل معك عبر الواتساب بشأن الحجز والسداد وموعد البدء، وإصدار ما يلزم من شهادات وسجلات للمركز.',
    'ولقياس فاعلية إعلاناتنا وعرض إعلانات عن كورساتنا الجديدة على من يهمّهم الأمر (انظر «الإعلانات وبكسل فيسبوك»).',
  ] },
  { title: 'من يطّلع عليها', body: [
    'يطّلع عليها فريق إدارة مركز مهاراتي المصرّح لهم فقط. لا نبيع بياناتك لأي جهة.',
    'تُحفظ البيانات على خدمات سحابية آمنة (Supabase وGoogle Sheets) تُستخدم لتنظيم عمل المركز.',
  ] },
  { title: 'الإعلانات وبكسل فيسبوك', body: [
    'نستخدم بكسل فيسبوك (Meta Pixel) في التطبيق لمعرفة عدد الزوار والتسجيلات وقياس نتائج إعلاناتنا على فيسبوك وإنستجرام. يُرسل البكسل إلى Meta بيانات تصفح تقنية وحدث «تسجيل» دون إرسال اسمك أو رقمك القومي.',
    'وقد نستخدم رقم هاتف المشتركين أو بريدهم (مشفَّراً بصيغة لا تُقرأ) لإنشاء «جمهور مخصص» في Meta، بغرض إعلامهم بكورساتنا الجديدة فقط. يحقّ لك الاعتراض على ذلك في أي وقت بالتواصل معنا، فنستبعد بياناتك من هذه القوائم.',
  ] },
  { title: 'مدة الاحتفاظ', body: [
    'نحتفظ بالبيانات طالما كانت لازمة لإدارة التدريب والسجلات، ثم تُحذف أو تُجهَّل عند طلبك أو بانتهاء الحاجة إليها.',
  ] },
  { title: 'حقوقك', body: [
    'يمكنك في أي وقت طلب الاطلاع على بياناتك أو تصحيحها أو حذفها، بالتواصل معنا عبر وسائل التواصل الموضحة في التطبيق.',
  ] },
];

export default function PrivacyPolicy({ open, onClose }: Props) {
  useBackClose(open, onClose);
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: 15 }}>
      <div role="dialog" aria-modal="true" aria-label="سياسة الخصوصية" onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', padding: 22, direction: 'rtl', textAlign: 'right', border: '2px solid var(--mh-primary)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--mh-navy)' }}>🔒 سياسة الخصوصية</h3>
        <p style={{ color: 'var(--mh-muted)', fontSize: 13, marginTop: 0 }}>نلتزم بحماية بياناتك الشخصية. هذه الصفحة توضح ما نجمعه وكيف نستخدمه.</p>
        {SECTIONS.map((s) => (
          <div key={s.title} style={{ marginBottom: 14 }}>
            <h4 style={{ margin: '0 0 6px', color: 'var(--mh-primary)' }}>{s.title}</h4>
            {s.body.map((p, i) => <p key={i} style={{ margin: '0 0 6px', fontSize: 14, lineHeight: 1.9, color: '#334155' }}>{p}</p>)}
          </div>
        ))}
        <button onClick={onClose} style={{ width: '100%', background: 'var(--mh-navy)', color: '#fff', border: 'none', padding: 12, borderRadius: 10, fontWeight: 'bold', cursor: 'pointer', fontSize: 15 }}>فهمت، إغلاق</button>
      </div>
    </div>
  );
}
