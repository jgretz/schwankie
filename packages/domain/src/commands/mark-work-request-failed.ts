import type {Database} from 'database';
import {workRequest} from 'database';
import {eq} from 'drizzle-orm';

import {getDb} from '../db';
import type {WorkRequest} from '../types';

export async function markWorkRequestFailed(
  id: string,
  errorMessage: string,
  db?: Database,
): Promise<WorkRequest> {
  const database = db || getDb();
  const result = await database
    .update(workRequest)
    .set({
      status: 'failed',
      errorMessage,
      completedAt: new Date(),
    })
    .where(eq(workRequest.id, id))
    .returning();

  return result[0]!;
}
