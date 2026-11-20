-- استيراد التسجيلات التي تُكتب يدوياً في Google Sheet إلى قاعدة بيانات التطبيق
-- شغّله مرة واحدة في Supabase -> SQL Editor (آمن لو تكرر تشغيله).
--
-- الفكرة: السكربت داخل الشيت يرسل الصفوف الجديدة عبر دالة محمية بكلمة سر خاصة،
-- فلا تُفتح قاعدة البيانات للعامة، ولا تُنشر بيانات المتدربين خارج التطبيق.

-- 1) جدول كلمة السر (لا يقرؤه الزوار ولا المشرفون من التطبيق)
create table if not exists mharaty.import_secret (
  id int primary key default 1 check (id = 1),
  value text not null
);
alter table mharaty.import_secret enable row level security;
revoke all on mharaty.import_secret from anon, authenticated;

-- 2) دالة الاستيراد
create or replace function mharaty.import_sheet_registration(p_secret text, p jsonb)
returns text
language plpgsql
security definer
set search_path = mharaty, public
as $$
declare
  v_status text;
begin
  if not exists (select 1 from mharaty.import_secret where value = p_secret) then
    raise exception 'unauthorized';
  end if;

  v_status := case p->>'status'
    when 'تم التواصل' then 'contacted'
    when 'بانتظار السداد' then 'awaiting_payment'
    when 'تم السداد' then 'paid'
    when 'مكتمل' then 'completed'
    when 'ملغي' then 'cancelled'
    else 'new'
  end;

  insert into mharaty.course_registrations (
    course_title, student_name, national_id, phone, email, address, training_type,
    education, workplace, job_title, status, notes, client_id, created_at, status_updated_at
  ) values (
    left(p->>'course_title', 300), left(p->>'student_name', 300), nullif(left(p->>'national_id', 30), ''), nullif(left(p->>'phone', 30), ''),
    nullif(left(p->>'email', 300), ''), nullif(left(p->>'address', 300), ''), nullif(left(p->>'training_type', 100), ''),
    nullif(left(p->>'education', 300), ''), nullif(left(p->>'workplace', 300), ''), nullif(left(p->>'job_title', 300), ''),
    v_status, nullif(left(p->>'notes', 1000), ''), left(p->>'client_id', 100),
    coalesce(nullif(p->>'created_at', '')::timestamptz, now()), now()
  )
  on conflict do nothing;

  if found then return 'inserted'; end if;
  return 'duplicate';
end;
$$;

revoke all on function mharaty.import_sheet_registration(text, jsonb) from public;
grant execute on function mharaty.import_sheet_registration(text, jsonb) to anon, authenticated;

-- 3) بعد تشغيل ما سبق: اضبط كلمة السر بتشغيل السطر التالي بعد تغيير الكلمة (حروف إنجليزية وأرقام فقط)،
--    ثم ضع نفس الكلمة في IMPORT_SECRET داخل ملف Sync.gs:
--
--    insert into mharaty.import_secret (id, value) values (1, 'ضع-كلمة-سر-طويلة-هنا')
--    on conflict (id) do update set value = excluded.value;
