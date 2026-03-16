import type {Database} from 'database';
import {link} from 'database';
import {eq} from 'drizzle-orm';

export async function deleteLink(db: Database, id: number): Promise<boolean> {
  const [deleted] = await db.delete(link).where(eq(link.id, id)).returning();
  return deleted !== undefined;
}
