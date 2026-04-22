import {setting} from 'database';
import {getDb} from '../db';
import {like} from 'drizzle-orm';

export async function clearGmailTokens(): Promise<void> {
  const db = getDb();
  await db.delete(setting).where(like(setting.key, 'gmail_%'));
}
