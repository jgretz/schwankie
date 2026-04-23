import type {Database} from 'database';
import {workRequest} from 'database';

import {getDb} from '../db';
import type {CreateWorkRequestInput, WorkRequest} from '../types';

export async function createWorkRequest(
  input: CreateWorkRequestInput,
  db?: Database,
): Promise<WorkRequest> {
  const database = db || getDb();
  const result = await database.insert(workRequest).values({
    type: input.type,
    payload: input.payload || {},
    status: 'pending',
  }).returning();

  return result[0]!;
}
