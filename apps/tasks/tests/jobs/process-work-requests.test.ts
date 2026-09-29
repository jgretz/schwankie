import {afterEach, beforeEach, describe, expect, it, mock} from 'bun:test';
import type PgBoss from 'pg-boss';
import type {FeedData, WorkRequestData} from 'client';
import {
  createProcessWorkRequestsHandler,
  type WorkRequestsApi,
} from '../../src/jobs/process-work-requests';

function makeWorkRequest(overrides: Partial<WorkRequestData> = {}): WorkRequestData {
  return {
    id: 'wr-1',
    type: 'refresh-all-feeds',
    payload: {},
    status: 'pending',
    errorMessage: null,
    createdAt: '2026-09-29T12:00:00.000Z',
    startedAt: null,
    completedAt: null,
    ...overrides,
  };
}

function makeFeed(overrides: Partial<FeedData> = {}): FeedData {
  return {
    id: 'feed-1',
    name: 'Feed',
    sourceUrl: 'https://example.com/feed.xml',
    disabled: false,
    errorCount: 0,
    lastError: null,
    createdAt: '2026-09-29T12:00:00.000Z',
    updatedAt: '2026-09-29T12:00:00.000Z',
    ...overrides,
  };
}

function createFakes(pending: WorkRequestData[]) {
  const api = {
    listPendingWorkRequests: mock(async function (_opts?: {mode?: 'hinted' | 'full'}) {
      return pending;
    }),
    startWorkRequest: mock(async function (id: string) {
      return makeWorkRequest({id, status: 'processing'}) as WorkRequestData | null;
    }),
    completeWorkRequest: mock(async function (id: string) {
      return makeWorkRequest({id, status: 'completed'});
    }),
    failWorkRequest: mock(async function (id: string, errorMessage: string) {
      return makeWorkRequest({id, status: 'failed', errorMessage});
    }),
    fetchAllFeeds: mock(async function () {
      return [makeFeed({id: 'feed-1'}), makeFeed({id: 'feed-2', sourceUrl: 'https://b.test'})];
    }),
  };
  const boss = {
    insert: mock(async function () {}),
    send: mock(async function () {
      return 'job-id';
    }),
  };
  const handler = function (mode: 'hinted' | 'full') {
    return createProcessWorkRequestsHandler(
      boss as unknown as PgBoss,
      mode,
      api as unknown as WorkRequestsApi,
    );
  };
  return {api, boss, handler};
}

async function run(handler: PgBoss.WorkHandler<unknown>): Promise<void> {
  await handler([]);
}

const originalLog = console.log;
const originalError = console.error;

beforeEach(function () {
  console.log = mock(function () {});
  console.error = mock(function () {});
});

afterEach(function () {
  console.log = originalLog;
  console.error = originalError;
});

describe('createProcessWorkRequestsHandler', function () {
  it('should pass the hinted mode through to listPendingWorkRequests', async function () {
    const {api, handler} = createFakes([]);

    await run(handler('hinted'));

    expect(api.listPendingWorkRequests).toHaveBeenCalledWith({mode: 'hinted'});
  });

  it('should pass the full mode through to listPendingWorkRequests', async function () {
    const {api, handler} = createFakes([]);

    await run(handler('full'));

    expect(api.listPendingWorkRequests).toHaveBeenCalledWith({mode: 'full'});
  });

  it('should insert an import-feed job per feed and complete a refresh-all-feeds request', async function () {
    const {api, boss, handler} = createFakes([makeWorkRequest({id: 'wr-feeds'})]);

    await run(handler('hinted'));

    expect(boss.insert).toHaveBeenCalledWith([
      {name: 'import-feed', data: {feedId: 'feed-1', sourceUrl: 'https://example.com/feed.xml'}},
      {name: 'import-feed', data: {feedId: 'feed-2', sourceUrl: 'https://b.test'}},
    ]);
    expect(api.completeWorkRequest).toHaveBeenCalledWith('wr-feeds');
    expect(api.failWorkRequest).toHaveBeenCalledTimes(0);
  });

  it('should dispatch schedule-import-emails and complete a refresh-emails request', async function () {
    const {api, boss, handler} = createFakes([
      makeWorkRequest({id: 'wr-emails', type: 'refresh-emails'}),
    ]);

    await run(handler('full'));

    expect(boss.send).toHaveBeenCalledWith('schedule-import-emails', {});
    expect(api.completeWorkRequest).toHaveBeenCalledWith('wr-emails');
  });

  it('should skip a request another worker already claimed', async function () {
    const {api, boss, handler} = createFakes([makeWorkRequest()]);
    api.startWorkRequest.mockImplementation(async function () {
      return null;
    });

    await run(handler('full'));

    expect(api.fetchAllFeeds).toHaveBeenCalledTimes(0);
    expect(boss.insert).toHaveBeenCalledTimes(0);
    expect(api.completeWorkRequest).toHaveBeenCalledTimes(0);
    expect(api.failWorkRequest).toHaveBeenCalledTimes(0);
  });

  it('should mark a request failed with the error message and continue with the next', async function () {
    const {api, handler} = createFakes([
      makeWorkRequest({id: 'wr-bad'}),
      makeWorkRequest({id: 'wr-good', type: 'refresh-emails'}),
    ]);
    api.fetchAllFeeds.mockImplementation(async function () {
      throw new Error('feeds unavailable');
    });

    await run(handler('hinted'));

    expect(api.failWorkRequest).toHaveBeenCalledWith('wr-bad', 'feeds unavailable');
    expect(api.completeWorkRequest).toHaveBeenCalledTimes(1);
    expect(api.completeWorkRequest).toHaveBeenCalledWith('wr-good');
  });
});
