import {eq} from 'drizzle-orm';
import {emailItem} from 'database';
import {getDb} from '../db';
import type {EmailItem} from '../types';

export async function markEmailItemRead(id: string): Promise<EmailItem | null> {
  const db = getDb();

  const [updated] = await db
    .update(emailItem)
    .set({read: true})
    .where(eq(emailItem.id, id))
    .returning();

  return updated ?? null;
}
