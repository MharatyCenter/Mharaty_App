import { useEffect, useRef } from 'react';

/**
 * يجعل زر الرجوع (أندرويد / المتصفح) يغلق أعلى نافذة أو شاشة فرعية مفتوحة
 * بدل الخروج من التطبيق. عند فتحها نضيف خطوة في سجل التنقل، وعند الرجوع نغلقها.
 * نستخدم مستمعاً واحداً ومكدّساً للطبقات حتى لا تُغلق طبقتان بضغطة رجوع واحدة.
 */
interface Layer { close: () => void; pushed: boolean }
const stack: Layer[] = [];
let skip = 0;
let attached = false;

function onPop() {
  if (skip > 0) { skip--; return; } // رجوع أجريناه نحن لإزالة خطوة زائدة
  const top = stack.pop();
  if (top) { top.pushed = false; top.close(); }
}

export function useBackClose(open: boolean, onClose: () => void) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    if (!attached) { window.addEventListener('popstate', onPop); attached = true; }
    const layer: Layer = { close: () => closeRef.current(), pushed: true };
    stack.push(layer);
    history.pushState({ ...(history.state || {}), mhLayer: true }, '');
    return () => {
      const i = stack.indexOf(layer);
      if (i >= 0) stack.splice(i, 1);
      if (layer.pushed) { skip++; history.back(); } // أُغلقت من الواجهة: نزيل الخطوة الزائدة
    };
  }, [open]);
}

/**
 * يُستدعى قبل الانتقال لشاشة جديدة من داخل نافذة مفتوحة (مثل نجاح تسجيل الدخول):
 * يترك خطوة النافذة في السجل لتستبدلها الشاشة الجديدة بـ replaceState بدل أن نرجع للخلف خطأً.
 */
export function dropLayers() {
  stack.forEach((l) => { l.pushed = false; });
  stack.length = 0;
}
