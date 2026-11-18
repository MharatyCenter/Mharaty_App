-- صور الكورسات: عمود الرابط + مخزن عام للقراءة وكتابة للمشرف فقط
-- شغّله مرة واحدة في Supabase -> SQL Editor (آمن لو تكرر تشغيله).

alter table mharaty.courses add column if not exists image_url text;

-- مخزن الصور (عام للقراءة حتى تظهر الصور للزوار)
insert into storage.buckets (id, name, public)
values ('course-images', 'course-images', true)
on conflict (id) do update set public = true;

drop policy if exists "course images public read" on storage.objects;
create policy "course images public read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'course-images');

drop policy if exists "course images admin write" on storage.objects;
create policy "course images admin write" on storage.objects
  for insert to authenticated with check (bucket_id = 'course-images');

drop policy if exists "course images admin update" on storage.objects;
create policy "course images admin update" on storage.objects
  for update to authenticated using (bucket_id = 'course-images') with check (bucket_id = 'course-images');

drop policy if exists "course images admin delete" on storage.objects;
create policy "course images admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'course-images');
