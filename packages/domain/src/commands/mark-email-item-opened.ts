import {eq} from 'drizzle-orm';
import {emailItem} from 'database';
import {getDb} from '../db';
import type {EmailItem} from '../types';

// Opening an item implies reading it, so both are set together.
export async function markEmailItemOpened(id: string): Promise<EmailItem | null> {
  const db = getDb();

  const [updated] = await db
    .update(emailItem)
    .set({read: true, openedAt: new Date()})
    .where(eq(emailItem.id, id))
    .returning();

  return updated ?? null;
}
