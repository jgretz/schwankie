import {mock, describe, it, expect, beforeAll} from 'bun:test';
import {Hono} from 'hono';

// Mock env module first
mock.module('env', () => ({parseEnv: () => ({API_KEY: 'test-key'})}));

// Mock @domain exports - comprehensive set including all routes
const mockGetLink = mock(async () => null as any);
const mockListLinks = mock(async () => ({links: [], total: 0}));
const mockCreateLink = mock(async () => null as any);
const mockUpdateLink = mock(async () => null as any);
const mockDeleteLink = mock(async () => false);
const mockResetEnrichment = mock(async () => false);
const mockListTags = mock(async () => ({tags: [], total: 0}));
const mockMergeTag = mock(async () => false);
const mockMarkTagNormalized = mock(async () => false);
const mockRenameTag = mock(async () => false);
const mockDeleteTag = mock(async () => false);
const mockNormalizeTag = mock(async () => '');
const mockGetSetting = mock(async () => null as any);
const mockSetSetting = mock(async () => undefined);
const mockValidateSettingValue = mock(() => ({success: true}));
const mockResolveTagMinCount = mock(async () => {
  const value = await mockGetSetting('tagCountFloor');
  const floor = value ? Number(value) : 1;
  return Number.isNaN(floor) ? 1 : floor;
});
const mockListFeeds = mock(async () => ({feeds: [], total: 0}));
const mockGetFeed = mock(async () => null as any);
const mockCreateFeed = mock(async () => null as any);
const mockUpdateFeed = mock(async () => null as any);
const mockDeleteFeed = mock(async () => false);
const mockListRssItems = mock(async () => ({items: [], total: 0}));
const mockMarkRssItemRead = mock(async () => ({read: true}));
const mockPromoteRssItem = mock(async () => null as any);
const mockBulkUpsertRssItems = mock(async () => undefined);

mock.module('@domain', () => ({
  getLink: mockGetLink,
  listLinks: mockListLinks,
  createLink: mockCreateLink,
  updateLink: mockUpdateLink,
  deleteLink: mockDeleteLink,
  resetEnrichment: mockResetEnrichment,
  listTags: mockListTags,
  mergeTag: mockMergeTag,
  markTagNormalized: mockMarkTagNormalized,
  renameTag: mockRenameTag,
  deleteTag: mockDeleteTag,
  normalizeTag: mockNormalizeTag,
  getSetting: mockGetSetting,
  setSetting: mockSetSetting,
  resolveTagMinCount: mockResolveTagMinCount,
  validateSettingValue: mockValidateSettingValue,
  listFeeds: mockListFeeds,
  getFeed: mockGetFeed,
  createFeed: mockCreateFeed,
  updateFeed: mockUpdateFeed,
  deleteFeed: mockDeleteFeed,
  listRssItems: mockListRssItems,
  markRssItemRead: mockMarkRssItemRead,
  promoteRssItem: mockPromoteRssItem,
  bulkUpsertRssItems: mockBulkUpsertRssItems,
  // Stubs for exports consumed by sibling route files (e.g. gmail.ts).
  // The mock.module registry is global across test files; omitting these
  // causes "Export not found" errors when gmail.test.ts loads after this one.
  init: () => {},
  createRssItem: mockSetSetting,
  listEmailItems: mockGetSetting,
  getEmailItem: mockGetSetting,
  createEmailItem: mockSetSetting,
  markEmailItemRead: mockSetSetting,
  promoteEmailItem: mockSetSetting,
  getGmailTokens: mockGetSetting,
  setGmailTokens: mockSetSetting,
  clearGmailTokens: mockSetSetting,
  clearGmailAuthTokens: mockSetSetting,
  setGmailFilter: mockSetSetting,
  loadKey: () => Buffer.from(new Uint8Array(32)),
  encryptToken: (x: string) => x,
  decryptToken: (x: string) => x,
}));

// Dynamic import after mocks are set up
type FeedsModule = typeof import('../../src/routes/feeds');
let feedsRoutes: FeedsModule['feedsRoutes'];

describe('Feeds Routes - Auth Enforcement', () => {
  let app: Hono;

  beforeAll(async () => {
    const mod = await import('../../src/routes/feeds');
    feedsRoutes = mod.feedsRoutes;
    app = new Hono();
    app.route('/', feedsRoutes);
  });

  describe('Public endpoints', () => {
    it('GET /api/feeds - public, no auth required', async () => {
      const req = new Request('http://localhost/api/feeds', {method: 'GET'});
      const res = await app.fetch(req);
      // Should not return 401; may return 500 if deps fail, but not auth failure
      expect(res.status).not.toBe(401);
    });

    it('GET /api/feeds/:id/items - public, no auth required', async () => {
      const req = new Request('http://localhost/api/feeds/test-id/items', {method: 'GET'});
      const res = await app.fetch(req);
      expect(res.status).not.toBe(401);
    });
  });

  describe('Protected endpoints - missing auth', () => {
    it('POST /api/feeds - requires auth, rejects without token', async () => {
      const req = new Request('http://localhost/api/feeds', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: 'Feed', sourceUrl: 'https://example.com/feed.xml'}),
      });
      const res = await app.fetch(req);
      expect(res.status).toBe(401);
    });

    it('PATCH /api/feeds/:id - requires auth, rejects without token', async () => {
      const req = new Request('http://localhost/api/feeds/test-id', {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({disabled: true}),
      });
      const res = await app.fetch(req);
      expect(res.status).toBe(401);
    });

    it('DELETE /api/feeds/:id - requires auth, rejects without token', async () => {
      const req = new Request('http://localhost/api/feeds/test-id', {method: 'DELETE'});
      const res = await app.fetch(req);
      expect(res.status).toBe(401);
    });

    it('POST /api/feeds/:id/items/:itemId/read - requires auth', async () => {
      const req = new Request('http://localhost/api/feeds/feed-id/items/item-id/read', {
        method: 'POST',
      });
      const res = await app.fetch(req);
      expect(res.status).toBe(401);
    });

    it('POST /api/feeds/:id/items/:itemId/promote - requires auth', async () => {
      const req = new Request('http://localhost/api/feeds/feed-id/items/item-id/promote', {
        method: 'POST',
      });
      const res = await app.fetch(req);
      expect(res.status).toBe(401);
    });

    it('POST /api/feeds/:id/items/bulk-upsert - requires auth (worker route)', async () => {
      const req = new Request('http://localhost/api/feeds/feed-id/items/bulk-upsert', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({items: []}),
      });
      const res = await app.fetch(req);
      expect(res.status).toBe(401);
    });

    it('GET /api/feeds/all - requires auth (worker route)', async () => {
      const req = new Request('http://localhost/api/feeds/all', {method: 'GET'});
      const res = await app.fetch(req);
      expect(res.status).toBe(401);
    });
  });

  describe('Protected endpoints - valid auth', () => {
    const validToken = process.env.API_KEY || 'test-key';

    it('POST /api/feeds - accepts valid token', async () => {
      const req = new Request('http://localhost/api/feeds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({name: 'Feed', sourceUrl: 'https://example.com/feed.xml'}),
      });
      const res = await app.fetch(req);
      // Should not be 401; may be 400 for validation, 500 for deps, etc.
      expect(res.status).not.toBe(401);
    });

    it('PATCH /api/feeds/:id - accepts valid token', async () => {
      const req = new Request('http://localhost/api/feeds/test-id', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({disabled: true}),
      });
      const res = await app.fetch(req);
      expect(res.status).not.toBe(401);
    });

    it('DELETE /api/feeds/:id - accepts valid token', async () => {
      const req = new Request('http://localhost/api/feeds/test-id', {
        method: 'DELETE',
        headers: {Authorization: `Bearer ${validToken}`},
      });
      const res = await app.fetch(req);
      expect(res.status).not.toBe(401);
    });

    it('GET /api/feeds/all - accepts valid token (worker route)', async () => {
      const req = new Request('http://localhost/api/feeds/all', {
        method: 'GET',
        headers: {Authorization: `Bearer ${validToken}`},
      });
      const res = await app.fetch(req);
      expect(res.status).not.toBe(401);
    });
  });
});
