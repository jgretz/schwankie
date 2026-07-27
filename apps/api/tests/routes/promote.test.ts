import {mock, describe, it, expect, beforeAll, beforeEach} from 'bun:test';
import {Hono} from 'hono';
import {HTTPException} from 'hono/http-exception';
// Deep import rather than `@domain`: the barrel is mocked below, and
// error-handler.ts branches on `instanceof`, so the test and the handler have
// to reach the same class identity.
import {DomainValidationError, NotFoundError} from 'domain/src/lib/errors';

// Mock env module first, before any routes load
mock.module('env', () => ({parseEnv: () => ({API_KEY: 'test-key'})}));

const mockGetLink = mock(async () => null as any);
const mockPromoteRssItem = mock(async () => null as any);
const mockPromoteEmailItem = mock(async () => null as any);
const mockRecordPromoteFailure = mock(async (_input?: unknown) => null as any);
const mockGetRssItem = mock(async () => null as any);
const mockGetEmailItem = mock(async () => null as any);
const mockNoop = mock(async () => null as any);

mock.module('@domain', () => ({
  DomainValidationError,
  NotFoundError,
  getLink: mockGetLink,
  promoteRssItem: mockPromoteRssItem,
  promoteEmailItem: mockPromoteEmailItem,
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
  markAllRssItemsRead: mockNoop,
  createRssItem: mockNoop,
  bulkUpsertRssItems: mockNoop,
  bulkUpsertEmailItems: mockNoop,
  listEmailItems: mockNoop,
  countRecentEmailItems: mockNoop,
  getEmailItem: mockGetEmailItem,
  getRssItem: mockGetRssItem,
  recordPromoteFailure: mockRecordPromoteFailure,
  listPromoteFailures: mockNoop,
  createEmailItem: mockNoop,
  markEmailItemRead: mockNoop,
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

const AUTH = {Authorization: 'Bearer test-key'};
const RSS_PROMOTE_URL = 'http://localhost/api/feeds/feed-id/items/item-id/promote';
const EMAIL_PROMOTE_URL =
  'http://localhost/api/emails/550e8400-e29b-41d4-a716-446655440000/promote';

describe('Promote routes - error mapping', function () {
  let app: Hono;
  let capturePromoteFailure: typeof import('../../src/commands/capture-promote-failure').capturePromoteFailure;

  beforeAll(async function () {
    const [feeds, emails, errors, capture] = await Promise.all([
      import('../../src/routes/feeds'),
      import('../../src/routes/emails'),
      import('../../src/middleware/error-handler'),
      import('../../src/commands/capture-promote-failure'),
    ]);

    app = new Hono();
    app.route('/', feeds.feedsRoutes);
    app.route('/', emails.emailsRouter);
    app.onError(errors.errorHandler);
    capturePromoteFailure = capture.capturePromoteFailure;
  });

  beforeEach(function () {
    mockGetLink.mockReset();
    mockPromoteRssItem.mockReset();
    mockPromoteEmailItem.mockReset();
    mockRecordPromoteFailure.mockReset();
    mockGetRssItem.mockReset();
    mockGetEmailItem.mockReset();
  });

  /** POST the promote and return the `[promote] source=...` console.error call. */
  async function promoteAndCaptureLogLine(url: string): Promise<unknown[] | undefined> {
    const originalConsoleError = console.error;
    const lines: unknown[][] = [];
    console.error = (...args: unknown[]) => {
      lines.push(args);
    };

    try {
      await app.fetch(new Request(url, {method: 'POST', headers: AUTH}));
    } finally {
      console.error = originalConsoleError;
    }

    return lines.find(
      (args) => typeof args[0] === 'string' && args[0].startsWith('[promote] source='),
    );
  }

  describe('DomainValidationError', function () {
    it('should return 422 naming the offending field when the rss url is over-long', async function () {
      mockPromoteRssItem.mockImplementation(async () => {
        throw new DomainValidationError('url', 'url exceeds the maximum of 2048 characters');
      });

      const res = await app.fetch(new Request(RSS_PROMOTE_URL, {method: 'POST', headers: AUTH}));
      const body = await res.json();

      expect(res.status).toBe(422);
      expect(body.field).toBe('url');
    });

    it('should return 422 when the email url is over-long', async function () {
      mockPromoteEmailItem.mockImplementation(async () => {
        throw new DomainValidationError('url', 'url exceeds the maximum of 2048 characters');
      });

      const res = await app.fetch(new Request(EMAIL_PROMOTE_URL, {method: 'POST', headers: AUTH}));
      const body = await res.json();

      expect(res.status).toBe(422);
      expect(body.field).toBe('url');
    });
  });

  describe('not found', function () {
    it('should return 404 when the rss item does not exist', async function () {
      mockPromoteRssItem.mockImplementation(async () => null);

      const res = await app.fetch(new Request(RSS_PROMOTE_URL, {method: 'POST', headers: AUTH}));

      expect(res.status).toBe(404);
    });

    it('should return 404 when the email command throws NotFoundError', async function () {
      mockPromoteEmailItem.mockImplementation(async () => {
        throw new NotFoundError('emailItem', 'missing-id');
      });

      const res = await app.fetch(new Request(EMAIL_PROMOTE_URL, {method: 'POST', headers: AUTH}));

      expect(res.status).toBe(404);
    });
  });

  describe('unhandled errors', function () {
    it('should return 500 without leaking postgres driver text', async function () {
      mockPromoteRssItem.mockImplementation(async () => {
        throw new Error('value too long for type character varying(800)');
      });

      const res = await app.fetch(new Request(RSS_PROMOTE_URL, {method: 'POST', headers: AUTH}));
      const text = await res.text();

      expect(res.status).toBe(500);
      expect(text).not.toContain('character varying');
      expect(text).not.toContain('22001');
    });

    it('should preserve the status of a thrown HTTPException', async function () {
      mockPromoteRssItem.mockImplementation(async () => {
        throw new HTTPException(413, {message: 'Payload too large'});
      });

      const res = await app.fetch(new Request(RSS_PROMOTE_URL, {method: 'POST', headers: AUTH}));

      expect(res.status).toBe(413);
    });
  });

  describe('failure capture', function () {
    it('should record the rss failure once and still return 422', async function () {
      mockPromoteRssItem.mockImplementation(async () => {
        throw new DomainValidationError('url', 'url exceeds the maximum of 2048 characters');
      });
      mockGetRssItem.mockImplementation(
        async () => ({link: 'https://example.com/a', title: 'Bubbles'}) as any,
      );

      const res = await app.fetch(new Request(RSS_PROMOTE_URL, {method: 'POST', headers: AUTH}));
      const body = await res.json();

      expect(mockRecordPromoteFailure).toHaveBeenCalledTimes(1);
      expect(mockRecordPromoteFailure.mock.calls[0]![0]).toMatchObject({
        source: 'rss',
        sourceItemId: 'item-id',
        url: 'https://example.com/a',
        title: 'Bubbles',
        errorMessage: 'url exceeds the maximum of 2048 characters',
        errorCode: 'DOMAIN_VALIDATION',
      });
      expect(res.status).toBe(422);
      expect(body.field).toBe('url');
    });

    it('should record the email failure once and still return 422', async function () {
      mockPromoteEmailItem.mockImplementation(async () => {
        throw new DomainValidationError('url', 'url exceeds the maximum of 2048 characters');
      });
      mockGetEmailItem.mockImplementation(
        async () => ({link: 'https://example.com/b', title: 'Newsletter'}) as any,
      );

      const res = await app.fetch(new Request(EMAIL_PROMOTE_URL, {method: 'POST', headers: AUTH}));
      const body = await res.json();

      expect(mockRecordPromoteFailure).toHaveBeenCalledTimes(1);
      expect(mockRecordPromoteFailure.mock.calls[0]![0]).toMatchObject({
        source: 'email',
        sourceItemId: '550e8400-e29b-41d4-a716-446655440000',
        url: 'https://example.com/b',
        title: 'Newsletter',
        errorMessage: 'url exceeds the maximum of 2048 characters',
        errorCode: 'DOMAIN_VALIDATION',
      });
      expect(res.status).toBe(422);
      expect(body.field).toBe('url');
    });

    it('should fall back to null context when the source lookup itself fails', async function () {
      mockPromoteRssItem.mockImplementation(async () => {
        throw new Error('value too long for type character varying(800)');
      });
      mockGetRssItem.mockImplementation(async () => {
        throw new Error('connection terminated');
      });

      const res = await app.fetch(new Request(RSS_PROMOTE_URL, {method: 'POST', headers: AUTH}));

      expect(mockRecordPromoteFailure).toHaveBeenCalledTimes(1);
      expect(mockRecordPromoteFailure.mock.calls[0]![0]).toMatchObject({url: null, title: null});
      expect(res.status).toBe(500);
    });

    it('should surface the original 422 when the capture write itself throws', async function () {
      mockPromoteRssItem.mockImplementation(async () => {
        throw new DomainValidationError('url', 'url exceeds the maximum of 2048 characters');
      });
      mockRecordPromoteFailure.mockImplementation(async () => {
        throw new Error('promote_failure insert failed');
      });

      const res = await app.fetch(new Request(RSS_PROMOTE_URL, {method: 'POST', headers: AUTH}));
      const body = await res.json();

      expect(res.status).toBe(422);
      expect(body.field).toBe('url');
    });

    it('should surface the original 500 when the capture write itself throws', async function () {
      mockPromoteEmailItem.mockImplementation(async () => {
        throw new Error('value too long for type character varying(800)');
      });
      mockRecordPromoteFailure.mockImplementation(async () => {
        throw new Error('promote_failure insert failed');
      });

      const res = await app.fetch(new Request(EMAIL_PROMOTE_URL, {method: 'POST', headers: AUTH}));
      const text = await res.text();

      expect(res.status).toBe(500);
      expect(text).not.toContain('promote_failure insert failed');
    });

    // The route rethrows whatever capture leaves behind, so capture must be
    // total. A null-prototype throwable makes `String(error)` throw, which the
    // guard only catches because it wraps the message extraction too, not just
    // the insert.
    it('should not throw on a throwable that resists stringifying', async function () {
      const hostile = Object.create(null);

      await capturePromoteFailure({source: 'rss', sourceItemId: 'item-id', error: hostile});

      expect(mockRecordPromoteFailure).toHaveBeenCalledTimes(0);
    });

    it('should record nothing when the rss promote succeeds', async function () {
      mockPromoteRssItem.mockImplementation(async () => 42 as any);
      mockGetLink.mockImplementation(async () => ({id: 42, url: 'https://example.com/a'}) as any);

      const res = await app.fetch(new Request(RSS_PROMOTE_URL, {method: 'POST', headers: AUTH}));

      expect(res.status).toBe(200);
      expect(mockRecordPromoteFailure).toHaveBeenCalledTimes(0);
    });

    it('should record nothing when the email promote succeeds', async function () {
      mockPromoteEmailItem.mockImplementation(async () => ({id: 42}) as any);

      const res = await app.fetch(new Request(EMAIL_PROMOTE_URL, {method: 'POST', headers: AUTH}));

      expect(res.status).toBe(200);
      expect(mockRecordPromoteFailure).toHaveBeenCalledTimes(0);
    });

    it('should record NOT_FOUND and still 404 when the rss item is missing', async function () {
      mockPromoteRssItem.mockImplementation(async () => null);

      const res = await app.fetch(new Request(RSS_PROMOTE_URL, {method: 'POST', headers: AUTH}));

      expect(mockRecordPromoteFailure).toHaveBeenCalledTimes(1);
      expect(mockRecordPromoteFailure.mock.calls[0]![0]).toMatchObject({
        source: 'rss',
        sourceItemId: 'item-id',
        errorCode: 'NOT_FOUND',
      });
      expect(res.status).toBe(404);
    });

    it('should record NOT_FOUND and still 404 when the email item is missing', async function () {
      mockPromoteEmailItem.mockImplementation(async () => {
        throw new NotFoundError('emailItem', 'missing-id');
      });

      const res = await app.fetch(new Request(EMAIL_PROMOTE_URL, {method: 'POST', headers: AUTH}));

      expect(mockRecordPromoteFailure).toHaveBeenCalledTimes(1);
      expect(mockRecordPromoteFailure.mock.calls[0]![0]).toMatchObject({
        source: 'email',
        errorCode: 'NOT_FOUND',
      });
      expect(res.status).toBe(404);
    });

    it('should record the postgres SQLSTATE when the driver supplies one', async function () {
      const driverError = Object.assign(
        new Error('value too long for type character varying(2048)'),
        {code: '22001'},
      );
      mockPromoteRssItem.mockImplementation(async () => {
        throw driverError;
      });

      const res = await app.fetch(new Request(RSS_PROMOTE_URL, {method: 'POST', headers: AUTH}));

      expect(mockRecordPromoteFailure.mock.calls[0]![0]).toMatchObject({errorCode: '22001'});
      expect(res.status).toBe(500);
    });

    // The `[promote]` line is the fly-logs half of this feature — operators grep
    // for it, so its prefix and key=value shape are a contract, not a detail.
    it('should log one greppable [promote] line carrying the original error', async function () {
      const promoteError = new DomainValidationError('url', 'url is too long');
      mockPromoteRssItem.mockImplementation(async () => {
        throw promoteError;
      });
      mockGetRssItem.mockImplementation(
        async () => ({link: 'https://example.com/a', title: 'Bubbles'}) as any,
      );

      const line = await promoteAndCaptureLogLine(RSS_PROMOTE_URL);

      expect(line).toBeDefined();
      expect(line![0]).toBe(
        '[promote] source=rss itemId=item-id url=https://example.com/a code=DOMAIN_VALIDATION message=url is too long',
      );
      expect(line![1]).toBe(promoteError);
    });

    it('should log dashes for the url and code it could not resolve', async function () {
      mockPromoteRssItem.mockImplementation(async () => {
        throw new Error('boom');
      });
      mockGetRssItem.mockImplementation(async () => null);

      const line = await promoteAndCaptureLogLine(RSS_PROMOTE_URL);

      expect(line![0]).toBe('[promote] source=rss itemId=item-id url=- code=- message=boom');
    });
  });
});
