import type {Database} from 'database';
import {workRequest} from 'database';
import {eq} from 'drizzle-orm';

import {getDb} from '../db';
import type {WorkRequest} from '../types';

export async function markWorkRequestCompleted(
  id: string,
  db?: Database,
): Promise<WorkRequest> {
  const database = db || getDb();
  const result = await database
    .update(workRequest)
    .set({
      status: 'completed',
      completedAt: new Date(),
    })
    .where(eq(workRequest.id, id))
    .returning();

  return result[0]!;
}
