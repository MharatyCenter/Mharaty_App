-- تسجيل عنوان IP للزيارات (يُقرأ من ترويسات الطلب في الخادم، ولا يمكن للزائر تزويره من التطبيق).
-- شغّله مرة واحدة في SQL Editor (آمن لو تكرر).
alter table mharaty.site_analytics_advanced add column if not exists ip_address text;

create or replace function mharaty.set_visit_ip() returns trigger
language plpgsql set search_path = mharaty, public as $$
declare h json;
begin
  begin h := current_setting('request.headers', true)::json; exception when others then h := null; end;
  new.ip_address := nullif(btrim(coalesce(
    split_part(coalesce(h->>'x-forwarded-for', ''), ',', 1),
    ''
  )), '');
  if new.ip_address is null and h is not null then
    new.ip_address := coalesce(nullif(h->>'cf-connecting-ip', ''), nullif(h->>'x-real-ip', ''));
  end if;
  return new;
end $$;

drop trigger if exists trg_set_visit_ip on mharaty.site_analytics_advanced;
create trigger trg_set_visit_ip before insert on mharaty.site_analytics_advanced
  for each row execute function mharaty.set_visit_ip();
