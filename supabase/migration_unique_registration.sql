-- منع التسجيل المكرر: نفس الرقم القومي لا يُسجَّل مرتين في نفس الكورس
-- (التسجيلات الملغاة لا تُحتسب، فيمكن لمن ألغى أن يسجل من جديد).
-- شغّله مرة واحدة في Supabase -> SQL Editor (آمن لو تكرر تشغيله).

do $$
begin
  create unique index if not exists course_registrations_nid_course_key
    on mharaty.course_registrations (national_id, lower(btrim(course_title)))
    where status <> 'cancelled';
exception when unique_violation then
  raise exception 'يوجد تسجيلات مكررة حالياً. شغّل الاستعلام التالي لعرضها ثم احذف أو ألغِ المكرر وأعد التشغيل: select national_id, course_title, count(*) from mharaty.course_registrations where status <> ''cancelled'' group by 1,2 having count(*) > 1;';
end $$;
