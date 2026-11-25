import { Capacitor } from '@capacitor/core';

/** هل نعمل داخل تطبيق أندرويد (APK) وليس المتصفح؟ */
export const isNative = () => Capacitor.isNativePlatform();

/** يفتح رابطاً خارجياً (واتساب مثلاً) في التطبيق/المتصفح الخارجي. يرجع false إن حُجب. */
export function openExternal(url: string): boolean {
  const a = document.createElement('a');
  a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
  document.body.appendChild(a); a.click(); a.remove();
  return true;
}

const toBase64 = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result).split(',')[1] || '');
  r.onerror = () => reject(r.error);
  r.readAsDataURL(blob);
});

/** يحفظ/ينزّل ملفاً: في المتصفح تنزيل عادي، وفي APK نافذة مشاركة (حفظ في الملفات/واتساب/البريد) */
export async function saveFile(blob: Blob, filename: string): Promise<void> {
  if (isNative()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const safe = filename.replace(/[\\/:*?"<>|]/g, '-');
    const res = await Filesystem.writeFile({ path: safe, data: await toBase64(blob), directory: Directory.Cache });
    await Share.share({ title: safe, url: res.uri, dialogTitle: 'حفظ / مشاركة الملف' });
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
