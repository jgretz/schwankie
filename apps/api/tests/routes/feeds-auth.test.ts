import {describe, it, expect, beforeAll} from 'bun:test';
import {Hono} from 'hono';
import {feedsRoutes} from '../../src/routes/feeds';

describe('Feeds Routes - Auth Enforcement', () => {
  let app: Hono;

  beforeAll(() => {
    app = new Hono();
    app.route('/api', feedsRoutes);
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
