-- تحديث حالة المتدرب في التطبيق عند تغييرها في الشيت. شغّله مرة واحدة في SQL Editor (آمن لو تكرر).
-- يعتمد على جدول import_secret من migration_sheet_import_ALL.sql
create or replace function mharaty.import_sheet_status(p_secret text, p jsonb)
returns integer
language plpgsql
security definer
set search_path = mharaty, public
as $$
declare
  v_item jsonb;
  v_status text;
  v_count integer := 0;
  v_n integer;
begin
  if not exists (select 1 from mharaty.import_secret where value = p_secret) then
    raise exception 'unauthorized';
  end if;

  for v_item in select * from jsonb_array_elements(coalesce(p, '[]'::jsonb)) loop
    v_status := case v_item->>'status'
      when 'جديد' then 'new'
      when 'تم التواصل' then 'contacted'
      when 'بانتظار السداد' then 'awaiting_payment'
      when 'تم السداد' then 'paid'
      when 'مكتمل' then 'completed'
      when 'ملغي' then 'cancelled'
      else null
    end;
    if v_status is null or coalesce(v_item->>'client_id', '') = '' then continue; end if;

    update mharaty.course_registrations
       set status = v_status, status_updated_at = now()
     where client_id = v_item->>'client_id' and status is distinct from v_status;
    get diagnostics v_n = row_count;
    v_count := v_count + v_n;
  end loop;

  return v_count;
end;
$$;

revoke all on function mharaty.import_sheet_status(text, jsonb) from public;
grant execute on function mharaty.import_sheet_status(text, jsonb) to anon, authenticated;
