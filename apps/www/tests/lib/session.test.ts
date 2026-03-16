import {beforeAll, beforeEach, describe, expect, it, mock} from 'bun:test';

const SESSION_SECRET = 'a'.repeat(32);
const cookies: Record<string, string> = {};

mock.module('@tanstack/react-start', () => ({
  createServerFn: () => ({handler: (fn: Function) => fn}),
}));

mock.module('@tanstack/react-start/server', () => ({
  getCookie: (name: string) => cookies[name] ?? undefined,
  setCookie: (name: string, value: string) => {
    cookies[name] = value;
  },
}));

mock.module('../../src/lib/env.server', () => ({
  getEnv: () => ({
    ALLOWED_EMAIL: 'admin@example.com',
    GOOGLE_CLIENT_ID: 'test-client-id',
    GOOGLE_CLIENT_SECRET: 'test-secret',
    GOOGLE_CALLBACK_URL: 'http://localhost:3000/auth/callback',
    SESSION_SECRET,
    API_KEY: 'test-api-key',
  }),
}));

let createSession: (email: string) => Promise<void>;
let getSession: () => Promise<{email: string; authenticated: boolean} | null>;
let destroySession: () => Promise<void>;

beforeAll(async function () {
  const mod = await import('../../src/lib/session.server');
  createSession = mod.createSession;
  getSession = mod.getSession;
  destroySession = mod.destroySession;
});

beforeEach(function () {
  for (const key of Object.keys(cookies)) {
    delete cookies[key];
  }
});

describe('createSession / getSession lifecycle', function () {
  it('should create a session and retrieve it', async function () {
    await createSession('admin@example.com');

    const session = await getSession();
    expect(session).not.toBeNull();
    expect(session!.email).toBe('admin@example.com');
    expect(session!.authenticated).toBe(true);
  });

  it('should return null when no cookie exists', async function () {
    const session = await getSession();
    expect(session).toBeNull();
  });
});

describe('getSession validation', function () {
  it('should return null for expired session', async function () {
    await createSession('admin@example.com');

    // Tamper with the cookie to set expiry in the past
    const raw = cookies['schwankie_session']!;
    const payload = JSON.parse(atob(raw));
    payload.expires = Date.now() - 1000;
    cookies['schwankie_session'] = btoa(JSON.stringify(payload));

    const session = await getSession();
    expect(session).toBeNull();
  });

  it('should return null for invalid signature', async function () {
    await createSession('admin@example.com');

    const raw = cookies['schwankie_session']!;
    const payload = JSON.parse(atob(raw));
    payload.sig = 'invalid-signature-value';
    cookies['schwankie_session'] = btoa(JSON.stringify(payload));

    const session = await getSession();
    expect(session).toBeNull();
  });

  it('should return null for malformed cookie', async function () {
    cookies['schwankie_session'] = 'not-valid-base64!!!';

    const session = await getSession();
    expect(session).toBeNull();
  });
});

describe('destroySession', function () {
  it('should clear the session cookie', async function () {
    await createSession('admin@example.com');
    expect(cookies['schwankie_session']).toBeTruthy();

    await destroySession();
    expect(cookies['schwankie_session']).toBe('');

    const session = await getSession();
    expect(session).toBeNull();
  });
});
