-- سياسات الأمان (RLS) لتطبيق مهاراتي
-- شغّلها في Supabase -> SQL Editor بعد إنشاء مستخدم المشرف (Authentication -> Users -> Add user)
-- وبعد تعطيل التسجيل العام: Authentication -> Providers -> Email -> إلغاء "Allow new users to sign up".
-- أي مستخدم "authenticated" يُعتبر مشرفاً، لذلك لا تُنشئ مستخدمين غير المشرفين.

grant usage on schema mharaty to anon, authenticated;

-- ===== جداول تُقرأ للجميع وتُعدَّل للمشرف فقط =====
do $$
declare t text;
begin
  foreach t in array array['courses','events','trainers','contact_info'] loop
    execute format('alter table mharaty.%I enable row level security', t);
    execute format('drop policy if exists "public read" on mharaty.%I', t);
    execute format('drop policy if exists "admin write" on mharaty.%I', t);
    execute format('create policy "public read" on mharaty.%I for select to anon, authenticated using (true)', t);
    execute format('create policy "admin write" on mharaty.%I for all to authenticated using (true) with check (true)', t);
    execute format('grant select on mharaty.%I to anon', t);
    execute format('grant select, insert, update, delete on mharaty.%I to authenticated', t);
  end loop;
end $$;

-- ===== جداول يكتب فيها الزائر ويقرؤها المشرف فقط =====
do $$
declare t text;
begin
  foreach t in array array['course_registrations','contact_messages','site_analytics_advanced'] loop
    execute format('alter table mharaty.%I enable row level security', t);
    execute format('drop policy if exists "public insert" on mharaty.%I', t);
    execute format('drop policy if exists "admin read" on mharaty.%I', t);
    execute format('drop policy if exists "admin manage" on mharaty.%I', t);
    execute format('create policy "public insert" on mharaty.%I for insert to anon, authenticated with check (true)', t);
    execute format('create policy "admin manage" on mharaty.%I for all to authenticated using (true) with check (true)', t);
    execute format('grant insert on mharaty.%I to anon', t);
    execute format('grant select, insert, update, delete on mharaty.%I to authenticated', t);
  end loop;
end $$;

-- الجداول ذات المعرّف التسلسلي تحتاج صلاحية على sequences
grant usage, select on all sequences in schema mharaty to anon, authenticated;

-- ملاحظة: إذا كانت لديك سياسات قديمة أخرى على هذه الجداول (مثل "allow all")،
-- احذفها من Authentication -> Policies وإلا ستبقى الجداول مفتوحة للجميع.
