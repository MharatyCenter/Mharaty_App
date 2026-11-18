import { supabase } from '../supabaseClient';

export const COURSE_IMAGES_BUCKET = 'course-images';

/** يصغّر الصورة (أقصى عرض 1200px) ويحوّلها JPEG لتخف على الإنترنت الضعيف */
export function resizeImage(file: File, maxWidth = 1200, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('تعذر معالجة الصورة'));
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('تعذر معالجة الصورة'))), 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('الملف ليس صورة صالحة')); };
    img.src = url;
  });
}

/** يرفع صورة كورس إلى Supabase Storage ويرجع رابطها العام */
export async function uploadCourseImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('اختر ملف صورة (JPG أو PNG).');
  if (file.size > 15 * 1024 * 1024) throw new Error('حجم الصورة كبير جداً (الحد 15 ميجابايت).');
  const blob = await resizeImage(file);
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase.storage.from(COURSE_IMAGES_BUCKET).upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
  if (error) throw new Error(error.message);
  return supabase.storage.from(COURSE_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl;
}
