import {mock, describe, it, expect, beforeAll} from 'bun:test';
import {Hono} from 'hono';

// Mock env module first
mock.module('env', () => ({parseEnv: () => ({API_KEY: 'test-key'})}));

type AuthModule = typeof import('../../src/middleware/auth');
let authMiddleware: AuthModule['authMiddleware'];

beforeAll(async function () {
  const mod = await import('../../src/middleware/auth');
  authMiddleware = mod.authMiddleware;
});

function makeApp(): Hono {
  const app = new Hono();
  app.use('/protected', authMiddleware());
  app.get('/protected', (c) => c.json({ok: true}));
  return app;
}

describe('authMiddleware', function () {
  it('should return 401 when no Authorization header', async function () {
    const app = makeApp();
    const res = await app.request('/protected');
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({error: 'Unauthorized'});
  });

  it('should return 401 when Authorization header does not start with Bearer', async function () {
    const app = makeApp();
    const res = await app.request('/protected', {
      headers: {Authorization: 'Basic test-key'},
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({error: 'Unauthorized'});
  });

  it('should return 401 when token does not match API_KEY', async function () {
    const app = makeApp();
    const res = await app.request('/protected', {
      headers: {Authorization: 'Bearer wrong-key'},
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({error: 'Unauthorized'});
  });

  it('should return 200 when token matches API_KEY', async function () {
    const app = makeApp();
    const res = await app.request('/protected', {
      headers: {Authorization: 'Bearer test-key'},
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ok: true});
  });
});
