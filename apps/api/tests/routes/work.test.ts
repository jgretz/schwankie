import {mock, describe, it, expect, beforeAll, beforeEach, afterEach} from 'bun:test';
import {Hono} from 'hono';
// Deep import rather than `@domain`: the barrel is mocked below, and
// error-handler.ts branches on `instanceof`, so the mock has to expose the
// same class identity the handler sees.
import {DomainValidationError, NotFoundError} from 'domain/src/lib/errors';
import {resetWorkRequestSignal} from '../../src/lib/work-request-signal';

mock.module('env', () => ({parseEnv: () => ({API_KEY: 'test-key'})}));

const mockListPendingWorkRequests = mock(async () => [] as any[]);
const mockCreateWorkRequest = mock(async (_input?: unknown) => ({id: 'wr-1'}) as any);
const mockNoop = mock(async () => null as any);

mock.module('@domain', () => ({
  searchHistoryCandidates: mock(async () => []),
  DomainValidationError,
  NotFoundError,
  listPendingWorkRequests: mockListPendingWorkRequests,
  createWorkRequest: mockCreateWorkRequest,
  markWorkRequestProcessing: mockNoop,
  markWorkRequestCompleted: mockNoop,
  markWorkRequestFailed: mockNoop,
  cleanupOldWorkRequests: mockNoop,
  // The mock.module registry is global across test files, so every @domain
  // mock must carry the exports every route file under test links against.
  init: () => {},
  listLinks: mockNoop,
  createLink: mockNoop,
  updateLink: mockNoop,
  deleteLink: mockNoop,
  deleteLinks: mockNoop,
  resetEnrichment: mockNoop,
  listTags: mockNoop,
  mergeTag: mockNoop,
  markTagNormalized: mockNoop,
  renameTag: mockNoop,
  deleteTag: mockNoop,
  normalizeTag: mockNoop,
  getSetting: mockNoop,
  setSetting: mockNoop,
  resolveTagMinCount: mockNoop,
  validateSettingValue: () => ({success: true}),
  listFeeds: mockNoop,
  getFeed: mockNoop,
  createFeed: mockNoop,
  updateFeed: mockNoop,
  deleteFeed: mockNoop,
  listRssItems: mockNoop,
  listAllRssItems: mockNoop,
  markRssItemRead: mockNoop,
  markRssItemOpened: mockNoop,
  markAllRssItemsRead: mockNoop,
  createRssItem: mockNoop,
  bulkUpsertRssItems: mockNoop,
  bulkUpsertEmailItems: mockNoop,
  listEmailItems: mockNoop,
  countRecentEmailItems: mockNoop,
  getEmailItem: mockNoop,
  getRssItem: mockNoop,
  recordPromoteFailure: mockNoop,
  listPromoteFailures: mockNoop,
  createEmailItem: mockNoop,
  markEmailItemRead: mockNoop,
  markEmailItemOpened: mockNoop,
  markAllEmailItemsRead: mockNoop,
  getGmailTokens: mockNoop,
  setGmailTokens: mockNoop,
  clearGmailTokens: mockNoop,
  clearGmailAuthTokens: mockNoop,
  setGmailFilter: mockNoop,
  loadKey: () => Buffer.from(new Uint8Array(32)),
  encryptToken: (x: string) => x,
  decryptToken: (x: string) => x,
  getRelatedByTags: mockNoop,
  getRelatedByVector: mockNoop,
  listLinksNeedingEmbedding: mockNoop,
  upsertLinkEmbedding: mockNoop,
  scoreQueuedBySimilarity: mockNoop,
  listDigestSourceItems: mockNoop,
  getDailySummary: mockNoop,
  listDailySummaryDates: mockNoop,
  upsertDailySummary: mockNoop,
  localSummaryDate: () => '2026-07-27',
  digestWindow: () => ({windowStart: new Date(), windowEnd: new Date()}),
}));

type WorkModule = typeof import('../../src/routes/work');
let workRoutes: WorkModule['workRoutes'];

beforeAll(async function () {
  const mod = await import('../../src/routes/work');
  workRoutes = mod.workRoutes;
});

function makeApp(): Hono {
  const app = new Hono();
  app.route('/', workRoutes);
  return app;
}

const AUTH = {Authorization: 'Bearer test-key'};

function getPending(app: Hono, query = '') {
  return app.request(`/api/work/pending${query}`, {headers: AUTH});
}

function postRefresh(app: Hono, path: string) {
  return app.request(path, {method: 'POST', headers: AUTH});
}

beforeEach(function () {
  mockListPendingWorkRequests.mockReset();
  mockListPendingWorkRequests.mockResolvedValue([{id: 'wr-1'}]);
  mockCreateWorkRequest.mockClear();
});

afterEach(function () {
  resetWorkRequestSignal();
});

describe('GET /api/work/pending', function () {
  it('should return [] without querying when hinted and no refresh was requested', async function () {
    const res = await getPending(makeApp(), '?mode=hinted');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
    expect(mockListPendingWorkRequests).toHaveBeenCalledTimes(0);
  });

  it('should query on every request when no mode is given', async function () {
    const app = makeApp();

    const first = await getPending(app);
    await getPending(app);

    expect(first.status).toBe(200);
    expect(await first.json()).toEqual([{id: 'wr-1'}]);
    expect(mockListPendingWorkRequests).toHaveBeenCalledTimes(2);
  });

  it('should query in full mode', async function () {
    const res = await getPending(makeApp(), '?mode=full');

    expect(res.status).toBe(200);
    expect(mockListPendingWorkRequests).toHaveBeenCalledTimes(1);
  });

  it('should return 400 for an unknown mode', async function () {
    const res = await getPending(makeApp(), '?mode=bogus');

    expect(res.status).toBe(400);
    expect(mockListPendingWorkRequests).toHaveBeenCalledTimes(0);
  });

  it('should return 401 without auth', async function () {
    const res = await makeApp().request('/api/work/pending?mode=hinted');

    expect(res.status).toBe(401);
  });
});

describe('refresh routes hint the next hinted poll', function () {
  for (const path of ['/api/feeds/refresh', '/api/emails/refresh']) {
    it(`should make the next hinted poll query exactly once after POST ${path}`, async function () {
      const app = makeApp();

      const created = await postRefresh(app, path);
      const first = await getPending(app, '?mode=hinted');
      const second = await getPending(app, '?mode=hinted');

      expect(created.status).toBe(201);
      expect(mockCreateWorkRequest).toHaveBeenCalledTimes(1);
      expect(await first.json()).toEqual([{id: 'wr-1'}]);
      expect(await second.json()).toEqual([]);
      expect(mockListPendingWorkRequests).toHaveBeenCalledTimes(1);
    });

    it(`should return 401 for POST ${path} without auth`, async function () {
      const res = await makeApp().request(path, {method: 'POST'});

      expect(res.status).toBe(401);
      expect(mockCreateWorkRequest).toHaveBeenCalledTimes(0);
    });
  }
});
