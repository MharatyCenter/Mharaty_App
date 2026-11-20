export interface NavItem { key: string; icon: string; label: string; onClick: () => void }

/** شريط تنقل سفلي ثابت (للجوال): أيقونة + اسم، وأزرار بحجم لمس مريح */
export default function BottomNav({ items, active }: { items: NavItem[]; active: string }) {
  return (
    <nav aria-label="التنقل الرئيسي" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 800, background: '#fff', borderTop: '1px solid var(--mh-border)', boxShadow: '0 -2px 10px rgba(0,0,0,0.06)', display: 'flex', direction: 'rtl', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {items.map((it) => {
        const on = it.key === active;
        return (
          <button key={it.key} onClick={it.onClick} aria-current={on ? 'page' : undefined}
            style={{ flex: 1, minHeight: 56, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, color: on ? 'var(--mh-primary)' : 'var(--mh-muted)', fontWeight: on ? 700 : 400, fontSize: 12 }}>
            <span style={{ fontSize: 22, lineHeight: 1, filter: on ? 'none' : 'grayscale(0.6)' }} aria-hidden="true">{it.icon}</span>
            {it.label}
          </button>
        );
      })}
    </nav>
  );
}
