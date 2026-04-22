import {setting} from 'database';
import {getDb} from '../db';
import {like, inArray} from 'drizzle-orm';

export async function clearGmailAuthTokens(): Promise<void> {
  const db = getDb();
  await db
    .delete(setting)
    .where(
      inArray(setting.key, ['gmail_access_token', 'gmail_refresh_token', 'gmail_token_expiry']),
    );
}

export async function clearGmailTokens(): Promise<void> {
  const db = getDb();
  await db.delete(setting).where(like(setting.key, 'gmail_%'));
}
