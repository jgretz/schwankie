import type {Database} from 'database';
import {workRequest} from 'database';
import {and, inArray, lt} from 'drizzle-orm';

import {getDb} from '../db';

export async function cleanupOldWorkRequests(db?: Database): Promise<number> {
  const database = db || getDb();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const result = await database
    .delete(workRequest)
    .where(
      and(
        inArray(workRequest.status, ['completed', 'failed']),
        lt(workRequest.completedAt, twentyFourHoursAgo),
      ),
    )
    .returning();

  return result.length;
}
