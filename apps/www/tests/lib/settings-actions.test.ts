import {afterEach, beforeAll, beforeEach, describe, expect, it, mock} from 'bun:test';

const SESSION_SECRET = 'a'.repeat(32);
const originalFetch = global.fetch;
const cookies: Record<string, string> = {};

mock.module('@tanstack/react-start', () => ({
  createServerFn: () => ({
    inputValidator: () => ({
      handler: (fn: (...args: unknown[]) => unknown) => fn,
    }),
  }),
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

mock.module('../../src/lib/init-client.server', () => ({
  initClientServer: mock(() => {}),
}));

let setSettingAction: (input: {
  data: {key: string; value: string};
}) => Promise<{key: string; value: string; set: boolean}>;
let createSession: (email: string) => Promise<void>;

beforeAll(async function () {
  const {init} = await import('client');
  init({apiUrl: 'http://localhost:3001', apiKey: 'test-key'});

  const mod = await import('../../src/lib/settings-actions');
  setSettingAction = mod.setSettingAction;

  const sessionMod = await import('../../src/lib/session.server');
  createSession = sessionMod.createSession;
});

afterEach(function () {
  global.fetch = originalFetch;
});

beforeEach(async function () {
  global.fetch = originalFetch;
  for (const key of Object.keys(cookies)) {
    delete cookies[key];
  }
  await createSession('admin@example.com');
  const {init} = await import('client');
  init({apiUrl: 'http://localhost:3001', apiKey: 'test-key'});
});

describe('setSettingAction', function () {
  it('should call setSetting with key and value', async function () {
    global.fetch = mock(
      async () =>
        ({
          ok: true,
          json: async () => ({key: 'theme', value: 'dark', set: true}),
        }) as unknown as Response,
    ) as unknown as typeof fetch;

    const result = await setSettingAction({data: {key: 'theme', value: 'dark'}});
    expect(result.set).toBe(true);
  });

  it('should throw Unauthorized when not authenticated', async function () {
    for (const key of Object.keys(cookies)) {
      delete cookies[key];
    }

    try {
      await setSettingAction({data: {key: 'theme', value: 'dark'}});
      expect.fail('should have thrown');
    } catch (error: any) {
      expect(error.message).toBe('Unauthorized');
    }
  });
});
