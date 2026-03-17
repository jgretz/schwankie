import {tag} from 'database';
import {eq, sql} from 'drizzle-orm';
import {getDb} from '../db';

export async function markTagNormalized(tagId: number): Promise<boolean> {
  const db = getDb();
  const result = await db
    .update(tag)
    .set({normalizedAt: sql`now()`})
    .where(eq(tag.id, tagId))
    .returning({id: tag.id});

  return result.length > 0;
}
