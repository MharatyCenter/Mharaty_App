-- صور الفعاليات (صورة أو أكثر لكل فعالية). شغّله مرة واحدة في SQL Editor (آمن لو تكرر).
-- يعتمد على مخزن الصور course-images من ملف migration_course_images.sql
alter table mharaty.events add column if not exists image_urls text[] not null default '{}';
