import type {Database} from 'database';
import {tag} from 'database';
import {eq, sql} from 'drizzle-orm';

export async function markTagNormalized(db: Database, tagId: number): Promise<boolean> {
  const result = await db
    .update(tag)
    .set({normalizedAt: sql`now()`})
    .where(eq(tag.id, tagId))
    .returning({id: tag.id});

  return result.length > 0;
}
