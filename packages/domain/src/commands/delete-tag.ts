import {tag} from 'database';
import {eq} from 'drizzle-orm';
import {getDb} from '../db';

export async function deleteTag(id: number): Promise<boolean> {
  const db = getDb();
  const result = await db.delete(tag).where(eq(tag.id, id));
  return (result.rowCount ?? 0) > 0;
}
