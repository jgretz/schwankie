import {afterEach, describe, expect, it, mock} from 'bun:test';
import {pollPendingWorkRequests} from '../../src/commands/poll-pending-work-requests';
import {markWorkRequestPending, resetWorkRequestSignal} from '../../src/lib/work-request-signal';

const PENDING = [{id: 'wr-1'}];

function makeList() {
  return mock(async function () {
    return PENDING;
  });
}

function makeFailingList() {
  return mock(async function (): Promise<typeof PENDING> {
    throw new Error('neon unavailable');
  });
}

afterEach(function () {
  resetWorkRequestSignal();
});

describe('pollPendingWorkRequests', function () {
  it('should return [] without querying when hinted and nothing was marked', async function () {
    const list = makeList();

    const result = await pollPendingWorkRequests('hinted', list);

    expect(result).toEqual([]);
    expect(list).toHaveBeenCalledTimes(0);
  });

  it('should query once after a mark, then go quiet again', async function () {
    const list = makeList();
    markWorkRequestPending();

    const first = await pollPendingWorkRequests('hinted', list);
    const second = await pollPendingWorkRequests('hinted', list);

    expect(first).toEqual(PENDING);
    expect(second).toEqual([]);
    expect(list).toHaveBeenCalledTimes(1);
  });

  it('should always query in full mode', async function () {
    const list = makeList();

    const result = await pollPendingWorkRequests('full', list);

    expect(result).toEqual(PENDING);
    expect(list).toHaveBeenCalledTimes(1);
  });

  it('should clear the mark in full mode so the next hinted poll stays quiet', async function () {
    const list = makeList();
    markWorkRequestPending();

    await pollPendingWorkRequests('full', list);
    await pollPendingWorkRequests('hinted', list);

    expect(list).toHaveBeenCalledTimes(1);
  });

  it('should rethrow and restore the mark when a hinted query fails', async function () {
    markWorkRequestPending();

    await expect(pollPendingWorkRequests('hinted', makeFailingList())).rejects.toThrow(
      'neon unavailable',
    );

    const retry = makeList();
    await pollPendingWorkRequests('hinted', retry);
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('should rethrow and set the mark when a full query fails', async function () {
    await expect(pollPendingWorkRequests('full', makeFailingList())).rejects.toThrow(
      'neon unavailable',
    );

    const retry = makeList();
    await pollPendingWorkRequests('hinted', retry);
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
