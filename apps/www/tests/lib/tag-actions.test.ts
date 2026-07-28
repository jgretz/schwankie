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

type TagActions = typeof import('../../src/lib/tag-actions');
type SessionServer = typeof import('../../src/lib/session.server');

let renameTagAction: TagActions['renameTagAction'];
let mergeTagAction: TagActions['mergeTagAction'];
let deleteTagAction: TagActions['deleteTagAction'];
let createSession: SessionServer['createSession'];

beforeAll(async function () {
  const {init} = await import('client');
  init({apiUrl: 'http://localhost:3001', apiKey: 'test-key'});

  const mod = await import('../../src/lib/tag-actions');
  renameTagAction = mod.renameTagAction;
  mergeTagAction = mod.mergeTagAction;
  deleteTagAction = mod.deleteTagAction;

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

describe('renameTagAction', function () {
  it('should call renameTag with id and text', async function () {
    // renameTag answers with a bare {renamed} acknowledgement, so the request itself is
    // the only place the id and the new text are observable.
    const fetchMock = mock(
      async (_url: string, _init?: RequestInit) =>
        ({
          ok: true,
          json: async () => ({renamed: true}),
        }) as unknown as Response,
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await renameTagAction({data: {id: 1, text: 'new-name'}});

    expect(result).toEqual({renamed: true});
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:3001/api/tags/1');
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(JSON.stringify({text: 'new-name'}));
  });

  it('should throw error when not authenticated', async function () {
    for (const key of Object.keys(cookies)) {
      delete cookies[key];
    }

    await expect(renameTagAction({data: {id: 1, text: 'new-name'}})).rejects.toThrow(
      /^Unauthorized$/,
    );
  });
});

describe('mergeTagAction', function () {
  it('should call mergeTag with aliasId and canonicalTagId', async function () {
    global.fetch = mock(
      async () =>
        ({
          ok: true,
          json: async () => ({merged: true}),
        }) as unknown as Response,
    ) as unknown as typeof fetch;

    const result = await mergeTagAction({data: {aliasId: 1, canonicalTagId: 2}});
    expect(result).toEqual({merged: true});
  });

  it('should throw Unauthorized when not authenticated', async function () {
    for (const key of Object.keys(cookies)) {
      delete cookies[key];
    }

    await expect(mergeTagAction({data: {aliasId: 1, canonicalTagId: 2}})).rejects.toThrow(
      /^Unauthorized$/,
    );
  });
});

describe('deleteTagAction', function () {
  it('should call deleteTag with id', async function () {
    global.fetch = mock(
      async () =>
        ({
          ok: true,
          json: async () => ({deleted: true}),
        }) as unknown as Response,
    ) as unknown as typeof fetch;

    const result = await deleteTagAction({data: {id: 1}});
    expect(result.deleted).toBe(true);
  });

  it('should throw Unauthorized when not authenticated', async function () {
    for (const key of Object.keys(cookies)) {
      delete cookies[key];
    }

    await expect(deleteTagAction({data: {id: 1}})).rejects.toThrow(/^Unauthorized$/);
  });
});
