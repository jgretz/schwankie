import {link} from 'database';
import {eq} from 'drizzle-orm';
import {getDb} from '../db';

export async function deleteLink(id: number): Promise<boolean> {
  const db = getDb();
  const [deleted] = await db.delete(link).where(eq(link.id, id)).returning();
  return deleted !== undefined;
}
