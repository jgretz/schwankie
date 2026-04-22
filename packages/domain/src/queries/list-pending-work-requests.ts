import type {Database} from 'database';
import {workRequest} from 'database';
import {asc, eq} from 'drizzle-orm';

import {getDb} from '../db';
import type {WorkRequest} from '../types';

export async function listPendingWorkRequests(db?: Database): Promise<WorkRequest[]> {
  const database = db || getDb();
  return database
    .select()
    .from(workRequest)
    .where(eq(workRequest.status, 'pending'))
    .orderBy(asc(workRequest.createdAt));
}
