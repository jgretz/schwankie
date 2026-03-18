import {tag} from 'database';
import {eq} from 'drizzle-orm';
import type {RenameTagInput} from '../types';
import {getDb} from '../db';
import {normalizeTag} from '../lib/normalize-tag';

export async function renameTag(input: RenameTagInput): Promise<boolean> {
  const db = getDb();
  const normalized = normalizeTag(input.text);

  if (normalized === null) return false;

  const result = await db.update(tag).set({text: normalized}).where(eq(tag.id, input.id));

  return (result.rowCount ?? 0) > 0;
}
