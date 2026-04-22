import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {makeWorkRequest} from '../helpers/factory';
import {cleanupOldWorkRequests, markWorkRequestCompleted, markWorkRequestFailed, markWorkRequestProcessing} from '../../src/index';
import {getDb} from '../../src/db';
import {workRequest} from 'database';
import {eq} from 'drizzle-orm';

describe('cleanupOldWorkRequests', function () {
  setupDb();

  it('should delete completed work requests older than 24h', async function () {
    const db = getDb();
    const wr = await makeWorkRequest();
    await markWorkRequestCompleted(wr!.id);

    const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
    await db
      .update(workRequest)
      .set({completedAt: twentyFiveHoursAgo})
      .where(eq(workRequest.id, wr!.id));

    const deleted = await cleanupOldWorkRequests();

    expect(deleted).toBe(1);
  });

  it('should delete failed work requests older than 24h', async function () {
    const db = getDb();
    const wr = await makeWorkRequest();
    await markWorkRequestFailed(wr!.id, 'Test error');

    const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
    await db
      .update(workRequest)
      .set({completedAt: twentyFiveHoursAgo})
      .where(eq(workRequest.id, wr!.id));

    const deleted = await cleanupOldWorkRequests();

    expect(deleted).toBe(1);
  });

  it('should not delete completed work requests newer than 24h', async function () {
    const wr = await makeWorkRequest();
    await markWorkRequestCompleted(wr!.id);

    const deleted = await cleanupOldWorkRequests();

    expect(deleted).toBe(0);
  });

  it('should not delete pending work requests', async function () {
    await makeWorkRequest();

    const deleted = await cleanupOldWorkRequests();

    expect(deleted).toBe(0);
  });

  it('should not delete processing work requests', async function () {
    const wr = await makeWorkRequest();
    await markWorkRequestProcessing(wr!.id);

    const deleted = await cleanupOldWorkRequests();

    expect(deleted).toBe(0);
  });
});
