import type {Database} from 'database';
import {tag} from 'database';
import {inArray} from 'drizzle-orm';
import {normalizeTag} from './normalize-tag';

// Structural type covering both Database and PgTransaction — both support insert/select
type DbLike = Pick<Database, 'insert' | 'select'>;

export function resolveTags(rawTags: string[] | undefined): string[] {
  if (!rawTags) return [];
  const normalized = rawTags.map(normalizeTag).filter((t): t is string => t !== null);
  return [...new Set(normalized)];
}

export async function upsertTags(
  db: DbLike,
  tags: string[],
): Promise<Array<{id: number; text: string}>> {
  if (tags.length === 0) return [];

  await db
    .insert(tag)
    .values(tags.map((text) => ({text})))
    .onConflictDoNothing();
  const rows = await db.select().from(tag).where(inArray(tag.text, tags));

  return rows.map((r) => ({id: r.id, text: r.text}));
}
