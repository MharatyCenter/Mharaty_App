-- إضافة حقول نموذج التسجيل الجديدة (شغّلها مرة واحدة في SQL Editor)
alter table mharaty.course_registrations
  add column if not exists national_id text,
  add column if not exists address text,
  add column if not exists training_type text,
  add column if not exists education text,
  add column if not exists workplace text,
  add column if not exists job_title text;
