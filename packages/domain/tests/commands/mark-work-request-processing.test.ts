import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {makeWorkRequest} from '../helpers/factory';
import {markWorkRequestProcessing} from '../../src/commands/mark-work-request-processing';

describe('markWorkRequestProcessing', function () {
  setupDb();

  it('should mark pending work request as processing', async function () {
    const wr = await makeWorkRequest();
    expect(wr?.status).toBe('pending');

    const updated = await markWorkRequestProcessing(wr!.id);

    expect(updated?.status).toBe('processing');
    expect(updated?.startedAt).toBeTruthy();
  });

  it('should return null if work request is not pending (race condition)', async function () {
    const wr = await makeWorkRequest();

    await markWorkRequestProcessing(wr!.id);

    const raced = await markWorkRequestProcessing(wr!.id);

    expect(raced).toBeNull();
  });

  it('should return null for non-existent work request', async function () {
    const updated = await markWorkRequestProcessing('non-existent-id');

    expect(updated).toBeNull();
  });
});
