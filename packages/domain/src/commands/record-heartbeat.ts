import {eq, sql} from 'drizzle-orm';
import {runner} from 'database';
import {getDb} from '../db';

export async function recordHeartbeat(workerId: string): Promise<void> {
  const db = getDb();
  await db
    .update(runner)
    .set({lastHeartbeatAt: sql`now()`})
    .where(eq(runner.workerId, workerId));
}
