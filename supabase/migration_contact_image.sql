-- صورة قسم التواصل (تظهر في نافذة «تواصل معنا»). شغّله مرة واحدة في SQL Editor (آمن لو تكرر).
-- تستخدم مخزن الصور course-images من ملف migration_course_images.sql
alter table mharaty.contact_info add column if not exists image_url text;
