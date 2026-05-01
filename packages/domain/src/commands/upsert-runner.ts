import {sql} from 'drizzle-orm';
import {runner} from 'database';
import {getDb} from '../db';
import type {UpsertRunnerInput} from '../types';

export async function upsertRunner(input: UpsertRunnerInput): Promise<void> {
  const db = getDb();
  await db
    .insert(runner)
    .values({
      workerId: input.workerId,
      hostname: input.hostname,
      pid: input.pid,
      version: input.version ?? null,
    })
    .onConflictDoUpdate({
      target: runner.workerId,
      set: {
        hostname: input.hostname,
        pid: input.pid,
        version: input.version ?? null,
        startedAt: sql`now()`,
        lastHeartbeatAt: sql`now()`,
      },
    });
}
