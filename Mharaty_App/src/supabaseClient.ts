import { createClient } from '@supabase/supabase-js';

// القيم تُقرأ من ملف .env (انظر .env.example). مفتاح anon عام بطبيعته،
// لكن الحماية الفعلية تتم عبر سياسات RLS في Supabase (انظر supabase/policies.sql).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('بيانات Supabase مفقودة: تأكد من وجود ملف .env (VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY).');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'mharaty',
  },
});
