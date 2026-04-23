import {and, eq} from 'drizzle-orm';
import {emailItem} from 'database';
import {getDb} from '../db';

export async function markAllEmailItemsRead(params: {from?: string}): Promise<number> {
  const db = getDb();

  const conditions = [eq(emailItem.read, false)];
  if (params.from) conditions.push(eq(emailItem.emailFrom, params.from));

  const updated = await db
    .update(emailItem)
    .set({read: true})
    .where(and(...conditions))
    .returning({id: emailItem.id});

  return updated.length;
}
