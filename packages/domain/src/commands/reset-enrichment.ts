import {link} from 'database';
import {eq} from 'drizzle-orm';
import {getDb} from '../db';

export async function resetEnrichment(id: number): Promise<boolean> {
  const db = getDb();

  const [updated] = await db
    .update(link)
    .set({enrichmentFailCount: 0, enrichmentLastError: null, content: null, updateDate: new Date()})
    .where(eq(link.id, id))
    .returning({id: link.id});

  return !!updated;
}
