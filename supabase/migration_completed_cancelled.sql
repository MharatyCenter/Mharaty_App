-- إضافة حالة "مكتمل" ورسالتي (إتمام الكورس / إلغاء الاشتراك) وتاريخ انتهاء الكورس
-- شغّله مرة واحدة في Supabase -> SQL Editor (آمن لو تكرر تشغيله).
-- يتطلب أن تكون شغّلت migration_status_whatsapp.sql من قبل.

alter table mharaty.courses
  add column if not exists end_date date;

alter table mharaty.course_registrations
  add column if not exists msg_completed_at timestamptz,
  add column if not exists msg_cancelled_at timestamptz;

alter table mharaty.course_registrations drop constraint if exists course_registrations_status_check;
alter table mharaty.course_registrations
  add constraint course_registrations_status_check
  check (status in ('new', 'contacted', 'awaiting_payment', 'paid', 'completed', 'cancelled'));

-- الزائر يستطيع فقط إنشاء تسجيل بحالة "جديد"
drop policy if exists "public insert" on mharaty.course_registrations;
create policy "public insert" on mharaty.course_registrations
  for insert to anon, authenticated
  with check (status = 'new' and paid_amount is null and notes is null
              and msg_registered_at is null and msg_payment_request_at is null
              and msg_paid_at is null and msg_reminder_at is null
              and msg_completed_at is null and msg_cancelled_at is null);

insert into mharaty.message_templates (key, title, body) values
('completed', 'رسالة إتمام الكورس', $t$مرحباً {name} 🎓
مبروك إتمامك كورس «{course}»!
نشكرك على ثقتك بنا، وسنوافيك بتفاصيل استلام الشهادة قريباً.
يسعدنا تقييمك للكورس ومشاركتنا رأيك.
مركز مهاراتي للتدريب$t$),
('cancelled', 'رسالة إلغاء الاشتراك', $t$مرحباً {name}،
نؤكد لك إلغاء اشتراكك في كورس «{course}» بناءً على طلبك.
يسعدنا انضمامك لأي من كورساتنا القادمة في أي وقت، ونتمنى لك التوفيق.
مركز مهاراتي للتدريب$t$)
on conflict (key) do nothing;
