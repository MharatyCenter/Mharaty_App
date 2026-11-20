-- استعلام المتابع عن كورساته بالاسم فقط (اسمان على الأقل، والاسم يجب أن يحتوي كل ما كتبه).
-- لا يُرجع إلا اسم الكورس والحالة، ولا يكشف أي بيانات شخصية. شغّله مرة واحدة.
drop function if exists mharaty.my_courses(text, text);
create or replace function mharaty.my_courses(p_name text)
returns table(course_title text, status text, created_at timestamptz)
language sql stable security definer set search_path = mharaty, public
as $$
  with q as (
    select translate(lower(btrim(regexp_replace(coalesce(p_name,''), '\s+', ' ', 'g'))), 'أإآىة', 'ااايه') as nm
  )
  select r.course_title, r.status, r.created_at
  from mharaty.course_registrations r, q
  where array_length(string_to_array(q.nm, ' '), 1) >= 2 and length(q.nm) >= 6
    and r.status <> 'cancelled'
    and not exists (select 1 from unnest(string_to_array(q.nm, ' ')) t where position(t in translate(lower(r.student_name), 'أإآىة', 'ااايه')) = 0)
  order by r.created_at desc
  limit 50;
$$;
revoke all on function mharaty.my_courses(text) from public;
grant execute on function mharaty.my_courses(text) to anon, authenticated;
