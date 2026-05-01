import {sql} from 'drizzle-orm';
import {runner} from 'database';
import {getDb} from '../db';

export async function cleanupStaleRunners(olderThanDays = 30): Promise<{deleted: number}> {
  const db = getDb();
  const result = await db
    .delete(runner)
    .where(sql`${runner.lastHeartbeatAt} < now() - (${olderThanDays} || ' days')::interval`)
    .returning({workerId: runner.workerId});
  return {deleted: result.length};
}
