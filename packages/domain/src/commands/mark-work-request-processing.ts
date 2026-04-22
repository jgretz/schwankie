import type {Database} from 'database';
import {workRequest} from 'database';
import {and, eq} from 'drizzle-orm';

import {getDb} from '../db';
import type {WorkRequest} from '../types';

export async function markWorkRequestProcessing(
  id: string,
  db?: Database,
): Promise<WorkRequest | null> {
  const database = db || getDb();
  const result = await database
    .update(workRequest)
    .set({
      status: 'processing',
      startedAt: new Date(),
    })
    .where(and(eq(workRequest.id, id), eq(workRequest.status, 'pending')))
    .returning();

  return result[0] || null;
}
