import { saveFile } from './native';
import { supabase } from '../supabaseClient';

const TABLES = ['courses', 'course_registrations', 'message_templates', 'events', 'contact_info', 'contact_messages'] as const;

/** يجمع كل بيانات المركز المهمة في ملف JSON واحد ويحمّله (نسخة احتياطية) */
export async function downloadFullBackup(): Promise<{ ok: boolean; counts: Record<string, number>; failed: string[] }> {
  const data: Record<string, unknown[]> = {};
  const counts: Record<string, number> = {};
  const failed: string[] = [];
  for (const t of TABLES) {
    const { data: rows, error } = await supabase.schema('mharaty').from(t).select('*');
    if (error) { failed.push(t); continue; }
    data[t] = rows || [];
    counts[t] = (rows || []).length;
  }
  if (failed.length === TABLES.length) return { ok: false, counts, failed };
  const payload = { app: 'mharaty', exported_at: new Date().toISOString(), tables: data };
  await saveFile(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), `mharaty-backup-${new Date().toISOString().slice(0, 10)}.json`);
  return { ok: true, counts, failed };
}
