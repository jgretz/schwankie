import {tag} from 'database';
import {eq} from 'drizzle-orm';
import {getDb} from '../db';

export async function deleteTag(id: number): Promise<boolean> {
  const db = getDb();
  const rows = await db.delete(tag).where(eq(tag.id, id)).returning({id: tag.id});
  return rows.length > 0;
}
