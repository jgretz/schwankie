import {tag} from 'database';
import {eq} from 'drizzle-orm';
import {getDb} from '../db';
import {normalizeTag} from '../lib/normalize-tag';

export async function renameTag(input: {id: number; text: string}): Promise<boolean> {
  const db = getDb();
  const normalized = normalizeTag(input.text);

  if (normalized === null) return false;

  const result = await db.update(tag).set({text: normalized}).where(eq(tag.id, input.id));

  return result.rowsAffected > 0;
}
