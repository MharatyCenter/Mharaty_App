-- حالة المتدرب + رسائل الواتساب + رسوم وموعد الكورس
-- شغّله مرة واحدة في Supabase -> SQL Editor (آمن لو تكرر تشغيله).

-- 1) بيانات الكورس: الرسوم وموعد البدء والمواعيد
alter table mharaty.courses
  add column if not exists fee numeric,
  add column if not exists start_date date,
  add column if not exists schedule text;

-- 2) بيانات التسجيل: الحالة والملاحظات والمبلغ وتتبع الرسائل المرسلة
alter table mharaty.course_registrations
  add column if not exists client_id text,
  add column if not exists status text not null default 'new',
  add column if not exists notes text,
  add column if not exists paid_amount numeric,
  add column if not exists status_updated_at timestamptz,
  add column if not exists msg_registered_at timestamptz,
  add column if not exists msg_payment_request_at timestamptz,
  add column if not exists msg_paid_at timestamptz,
  add column if not exists msg_reminder_at timestamptz;

alter table mharaty.course_registrations drop constraint if exists course_registrations_status_check;
alter table mharaty.course_registrations
  add constraint course_registrations_status_check
  check (status in ('new', 'contacted', 'awaiting_payment', 'paid', 'cancelled'));

create unique index if not exists course_registrations_client_id_key
  on mharaty.course_registrations (client_id) where client_id is not null;

-- الزائر يستطيع فقط إنشاء تسجيل بحالة "جديد" (لا يستطيع تعيين "تم السداد" بنفسه)
drop policy if exists "public insert" on mharaty.course_registrations;
create policy "public insert" on mharaty.course_registrations
  for insert to anon, authenticated
  with check (status = 'new' and paid_amount is null and notes is null
              and msg_registered_at is null and msg_payment_request_at is null
              and msg_paid_at is null and msg_reminder_at is null);

-- 3) قوالب الرسائل (للمشرف فقط)
create table if not exists mharaty.message_templates (
  key text primary key,
  title text not null,
  body text not null,
  updated_at timestamptz not null default now()
);

alter table mharaty.message_templates enable row level security;
drop policy if exists "admin manage" on mharaty.message_templates;
create policy "admin manage" on mharaty.message_templates for all to authenticated using (true) with check (true);
grant select, insert, update, delete on mharaty.message_templates to authenticated;

insert into mharaty.message_templates (key, title, body) values
('registered', 'رسالة تأكيد التسجيل', $t$مرحباً {name} 👋
تم استلام تسجيلك في كورس «{course}» بنجاح ✅
نوع التدريب: {training_type}
سنوافيك بتفاصيل السداد وموعد البدء قريباً.
مركز مهاراتي للتدريب$t$),
('payment_request', 'رسالة طلب سداد الرسوم', $t$مرحباً {name}،
لتأكيد حجز مقعدك في كورس «{course}» برجاء سداد الرسوم: {fee} جنيه.

طرق السداد:
(اكتب هنا بيانات السداد: رقم المحفظة / الحساب البنكي)

بعد السداد أرسل لنا صورة الإيصال على هذا الرقم.
مركز مهاراتي للتدريب$t$),
('paid', 'رسالة تأكيد السداد', $t$مرحباً {name}،
تم استلام رسوم كورس «{course}» ✅ وتأكد حجزك.
موعد البدء: {start_date}
المواعيد: {schedule}
نتشرف بوجودك 🌟
مركز مهاراتي للتدريب$t$),
('reminder', 'رسالة تذكير بموعد البدء', $t$مرحباً {name} ⏰
تذكير: يبدأ كورس «{course}» يوم {start_date}
المواعيد: {schedule}
نوع التدريب: {training_type}
في انتظارك!
مركز مهاراتي للتدريب$t$)
on conflict (key) do nothing;
