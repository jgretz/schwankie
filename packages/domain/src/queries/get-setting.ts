import {eq} from 'drizzle-orm';
import {setting} from 'database';
import {getDb} from '../db';

export async function getSetting(key: string): Promise<string | null> {
  const db = getDb();
  const result = await db
    .select({value: setting.value})
    .from(setting)
    .where(eq(setting.key, key));

  return result[0]?.value ?? null;
}
