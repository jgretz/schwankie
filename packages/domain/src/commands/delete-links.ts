import {link} from 'database';
import {inArray} from 'drizzle-orm';
import {getDb} from '../db';

export async function deleteLinks(ids: number[]): Promise<number> {
  if (ids.length === 0) return 0;

  const db = getDb();
  const deleted = await db.delete(link).where(inArray(link.id, ids)).returning({id: link.id});
  return deleted.length;
}
