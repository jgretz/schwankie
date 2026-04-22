import {mock, describe, it, expect, beforeAll} from 'bun:test';
import {Hono} from 'hono';

// Mock modules first, before any imports
const mockGetSetting = mock(async () => null as any);
const mockSetSetting = mock(async () => undefined);
const mockClearGmailTokens = mock(async () => undefined);
const mockSetGmailTokens = mock(async () => undefined);
const mockGetGmailTokens = mock(async () => null as any);
const mockRefreshGmailTokens = mock(async () => null as any);

mock.module('env', () => ({parseEnv: () => ({API_KEY: 'test-key'})}));

mock.module('@domain', () => ({
  getSetting: mockGetSetting,
  setSetting: mockSetSetting,
  clearGmailTokens: mockClearGmailTokens,
  setGmailTokens: mockSetGmailTokens,
  getGmailTokens: mockGetGmailTokens,
  // Mock all other exports that might be needed
  init: () => {},
  listLinks: mockGetSetting,
  listTags: mockGetSetting,
  getLink: mockGetSetting,
  resolveTagMinCount: mockGetSetting,
  listFeeds: mockGetSetting,
  getFeed: mockGetSetting,
  listRssItems: mockGetSetting,
  listEmailItems: mockGetSetting,
  getEmailItem: mockGetSetting,
  createLink: mockSetSetting,
  deleteLink: mockSetSetting,
  updateLink: mockSetSetting,
  mergeTag: mockSetSetting,
  renameTag: mockSetSetting,
  deleteTag: mockSetSetting,
  markTagNormalized: mockSetSetting,
  resetEnrichment: mockSetSetting,
  createFeed: mockSetSetting,
  updateFeed: mockSetSetting,
  deleteFeed: mockSetSetting,
  createRssItem: mockSetSetting,
  markRssItemRead: mockSetSetting,
  promoteRssItem: mockSetSetting,
  createEmailItem: mockSetSetting,
  markEmailItemRead: mockSetSetting,
  promoteEmailItem: mockSetSetting,
  setGmailFilter: mockSetSetting,
  normalizeTag: (x: any) => x,
  validateSettingValue: () => ({success: true}),
  loadKey: () => Buffer.from(new Uint8Array(32)),
  encryptToken: (x: string) => x,
  decryptToken: (x: string) => x,
}));

const mockBuildGmailAuthUrl = mock(() =>
  'https://accounts.google.com/o/oauth2/v2/auth?...',
);
const mockExchangeGmailCodeWithGoogle = mock(async () => ({
  accessToken: 'access123',
  refreshToken: 'refresh123',
  expiryDate: new Date('2026-12-31'),
  email: 'user@gmail.com',
}));

class GmailTokenRevokedError extends Error {}

mock.module('../../src/lib/gmail-oauth', () => ({
  buildGmailAuthUrl: mockBuildGmailAuthUrl,
  exchangeGmailCodeWithGoogle: mockExchangeGmailCodeWithGoogle,
  GmailTokenRevokedError,
}));

mock.module('../../src/commands/refresh-gmail-tokens', () => ({
  refreshGmailTokens: mockRefreshGmailTokens,
}));

type GmailModule = typeof import('../../src/routes/gmail');
let gmailRouter: GmailModule['gmailRouter'];

beforeAll(async function () {
  const mod = await import('../../src/routes/gmail');
  gmailRouter = mod.gmailRouter;
});

function makeApp(): Hono {
  const app = new Hono();
  app.route('/', gmailRouter);
  return app;
}

describe('Gmail Routes', function () {
  describe('GET /api/gmail/auth-url', function () {
    it('should return auth URL', async function () {
      const app = makeApp();
      const res = await app.request('/api/gmail/auth-url', {
        headers: {Authorization: 'Bearer test-key'},
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveProperty('url');
    });

    it('should reject without auth', async function () {
      const app = makeApp();
      const res = await app.request('/api/gmail/auth-url');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/gmail/exchange-code', function () {
    it('should exchange code for tokens', async function () {
      mockExchangeGmailCodeWithGoogle.mockResolvedValueOnce({
        accessToken: 'access123',
        refreshToken: 'refresh123',
        expiryDate: new Date('2026-12-31'),
        email: 'user@gmail.com',
      });

      const app = makeApp();
      const res = await app.request('/api/gmail/exchange-code', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({code: 'auth_code_123'}),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.connected).toBe(true);
      expect(json.email).toBe('user@gmail.com');
    });

    it('should reject invalid request body', async function () {
      const app = makeApp();
      const res = await app.request('/api/gmail/exchange-code', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({invalid: 'data'}),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/gmail/disconnect', function () {
    it('should disconnect gmail', async function () {
      const app = makeApp();
      const res = await app.request('/api/gmail/disconnect', {
        method: 'POST',
        headers: {Authorization: 'Bearer test-key'},
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.disconnected).toBe(true);
      expect(mockClearGmailTokens.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/gmail/status', function () {
    it('should return status', async function () {
      mockGetSetting.mockResolvedValueOnce(null);
      mockGetSetting.mockResolvedValueOnce(null);
      mockGetSetting.mockResolvedValueOnce(null);

      const app = makeApp();
      const res = await app.request('/api/gmail/status', {
        headers: {Authorization: 'Bearer test-key'},
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveProperty('connected');
      expect(json).toHaveProperty('filter');
      expect(json).toHaveProperty('lastImportedAt');
    });
  });

  describe('POST /api/gmail/filter', function () {
    it('should set gmail filter', async function () {
      const app = makeApp();
      const res = await app.request('/api/gmail/filter', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({filter: 'is:unread'}),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.filter).toBe('is:unread');
    });
  });

  describe('GET /api/gmail/tokens', function () {
    it('should return tokens when available', async function () {
      mockRefreshGmailTokens.mockResolvedValueOnce({
        accessToken: 'access123',
        refreshToken: 'refresh123',
        expiry: new Date('2026-12-31'),
      });

      const app = makeApp();
      const res = await app.request('/api/gmail/tokens', {
        headers: {Authorization: 'Bearer test-key'},
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveProperty('accessToken');
      expect(json).toHaveProperty('refreshToken');
      expect(json).toHaveProperty('expiry');
    });

    it('should return 404 when not connected', async function () {
      mockRefreshGmailTokens.mockResolvedValueOnce(null);

      const app = makeApp();
      const res = await app.request('/api/gmail/tokens', {
        headers: {Authorization: 'Bearer test-key'},
      });

      expect(res.status).toBe(404);
    });

    it('should return 410 and clear tokens on invalid_grant', async function () {
      mockRefreshGmailTokens.mockRejectedValueOnce(
        new GmailTokenRevokedError('invalid_grant'),
      );

      const app = makeApp();
      const res = await app.request('/api/gmail/tokens', {
        headers: {Authorization: 'Bearer test-key'},
      });

      expect(res.status).toBe(410);
    });
  });
});
