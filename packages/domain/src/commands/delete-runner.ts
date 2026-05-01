import {eq} from 'drizzle-orm';
import {runner} from 'database';
import {getDb} from '../db';

export async function deleteRunner(workerId: string): Promise<void> {
  const db = getDb();
  await db.delete(runner).where(eq(runner.workerId, workerId));
}
