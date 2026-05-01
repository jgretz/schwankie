import {desc} from 'drizzle-orm';
import {runner} from 'database';
import {getDb} from '../db';
import type {RunnerRow} from '../types';

export async function listRunners(): Promise<RunnerRow[]> {
  const db = getDb();
  return db.select().from(runner).orderBy(desc(runner.lastHeartbeatAt));
}
