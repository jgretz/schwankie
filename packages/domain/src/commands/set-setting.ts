import {setting} from 'database';
import {getDb} from '../db';

export async function setSetting(
  key: string,
  value: string
): Promise<void> {
  const db = getDb();
  await db
    .insert(setting)
    .values({key, value})
    .onConflictDoUpdate({
      target: setting.key,
      set: {value},
    });
}
