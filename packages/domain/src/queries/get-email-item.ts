import {eq} from 'drizzle-orm';
import {emailItem} from 'database';
import {getDb} from '../db';
import type {EmailItem} from '../types';

export async function getEmailItem(id: string): Promise<EmailItem | null> {
  const db = getDb();

  const item = await db.query.emailItem.findFirst({
    where: eq(emailItem.id, id),
  });

  return item ?? null;
}
