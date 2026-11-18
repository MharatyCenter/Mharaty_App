import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';
interface ToastItem { id: number; text: string; type: ToastType }

interface ToastApi {
  success: (text: string) => void;
  error: (text: string) => void;
  info: (text: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const COLORS: Record<ToastType, { bg: string; fg: string; border: string; icon: string }> = {
  success: { bg: '#d1fae5', fg: '#065f46', border: '#10b981', icon: '✅' },
  error: { bg: '#fee2e2', fg: '#991b1b', border: '#ef4444', icon: '⚠️' },
  info: { bg: '#e0e7ff', fg: '#3730a3', border: '#8b44db', icon: 'ℹ️' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const push = useCallback((type: ToastType, text: string) => {
    const id = nextId.current++;
    setItems((prev) => [...prev.slice(-2), { id, text, type }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 4500);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (t) => push('success', t),
      error: (t) => push('error', t),
      info: (t) => push('info', t),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        style={{
          position: 'fixed', top: 'calc(12px + env(safe-area-inset-top))', left: 0, right: 0, zIndex: 3000,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '0 12px', pointerEvents: 'none',
          direction: 'rtl',
        }}
      >
        {items.map((t) => {
          const c = COLORS[t.type];
          return (
            <div
              key={t.id}
              role={t.type === 'error' ? 'alert' : 'status'}
              style={{
                backgroundColor: c.bg, color: c.fg, borderRight: `5px solid ${c.border}`, borderRadius: '10px',
                padding: '11px 16px', fontSize: '14px', fontWeight: 'bold', maxWidth: '420px', width: '100%',
                boxShadow: '0 6px 20px rgba(0,0,0,0.15)', animation: 'mh-slide-in 0.25s ease', pointerEvents: 'auto',
              }}
            >
              {c.icon} {t.text}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
