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

let fetchMetadataAction: (input: {data: {url: string}}) => Promise<{url: string; title: string}>;
let createLinkAction: (input: {
  data: {url: string; title: string; tags?: string[]};
}) => Promise<{id: number; url: string; title: string; tags: {id: number; tag: string}[]}>;
let updateLinkAction: (input: {
  data: {id: number; title?: string; tags?: string[]};
}) => Promise<{id: number; title: string; tags: {id: number; tag: string}[]}>;
let resetEnrichmentAction: (input: {data: {id: number}}) => Promise<{id: number; reset: boolean}>;
let refetchLinkAction: (input: {data: {id: number}}) => Promise<{id: number; refetched: boolean}>;
let suggestTagsAction: (input: {data: {id: number}}) => Promise<{id: number; tag: string}[]>;
let deleteLinkAction: (input: {data: {id: number}}) => Promise<{id: number; deleted: boolean}>;
let createSession: (email: string) => Promise<void>;

beforeAll(async function () {
  const {init} = await import('client');
  init({apiUrl: 'http://localhost:3001', apiKey: 'test-key'});

  const mod = await import('../../src/lib/link-actions');
  fetchMetadataAction = mod.fetchMetadataAction;
  createLinkAction = mod.createLinkAction;
  updateLinkAction = mod.updateLinkAction;
  resetEnrichmentAction = mod.resetEnrichmentAction;
  refetchLinkAction = mod.refetchLinkAction;
  suggestTagsAction = mod.suggestTagsAction;
  deleteLinkAction = mod.deleteLinkAction;

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

describe('fetchMetadataAction', function () {
  it('should call fetchMetadata with url', async function () {
    global.fetch = mock(
      async () =>
        ({
          ok: true,
          json: async () => ({url: 'https://example.com', title: 'Test Title'}),
        }) as unknown as Response,
    ) as unknown as typeof fetch;

    const result = await fetchMetadataAction({data: {url: 'https://example.com'}});
    expect(result).toEqual({url: 'https://example.com', title: 'Test Title'});
  });

  it('should throw error when not authenticated', async function () {
    for (const key of Object.keys(cookies)) {
      delete cookies[key];
    }

    try {
      await fetchMetadataAction({data: {url: 'https://example.com'}});
      expect.fail('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Unauthorized');
    }
  });
});

describe('createLinkAction', function () {
  it('should call createLink with data', async function () {
    global.fetch = mock(
      async () =>
        ({
          ok: true,
          json: async () => ({id: 1, url: 'https://example.com', title: 'Test', tags: ['tag1']}),
        }) as unknown as Response,
    ) as unknown as typeof fetch;

    const input = {url: 'https://example.com', title: 'Test', tags: ['tag1']};
    const result = await createLinkAction({data: input});
    expect(result.id).toBe(1);
  });

  it('should throw Unauthorized when not authenticated', async function () {
    for (const key of Object.keys(cookies)) {
      delete cookies[key];
    }

    try {
      await createLinkAction({data: {url: 'https://example.com', title: 'Test'}});
      expect.fail('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Unauthorized');
    }
  });
});

describe('updateLinkAction', function () {
  it('should call updateLink with id and rest of data', async function () {
    global.fetch = mock(
      async () =>
        ({
          ok: true,
          json: async () => ({id: 1, title: 'Updated', tags: ['tag2']}),
        }) as unknown as Response,
    ) as unknown as typeof fetch;

    const input = {id: 1, title: 'Updated', tags: ['tag2']};
    const result = await updateLinkAction({data: input});
    expect(result.id).toBe(1);
  });

  it('should throw Unauthorized when not authenticated', async function () {
    for (const key of Object.keys(cookies)) {
      delete cookies[key];
    }

    try {
      await updateLinkAction({data: {id: 1, title: 'Updated'}});
      expect.fail('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Unauthorized');
    }
  });
});

describe('resetEnrichmentAction', function () {
  it('should call resetEnrichment with id', async function () {
    global.fetch = mock(
      async () =>
        ({
          ok: true,
          json: async () => ({id: 1, reset: true}),
        }) as unknown as Response,
    ) as unknown as typeof fetch;

    const result = await resetEnrichmentAction({data: {id: 1}});
    expect(result.reset).toBe(true);
  });

  it('should throw Unauthorized when not authenticated', async function () {
    for (const key of Object.keys(cookies)) {
      delete cookies[key];
    }

    try {
      await resetEnrichmentAction({data: {id: 1}});
      expect.fail('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Unauthorized');
    }
  });
});

describe('refetchLinkAction', function () {
  it('should call refetchLink with id', async function () {
    global.fetch = mock(
      async () =>
        ({
          ok: true,
          json: async () => ({id: 1, refetched: true}),
        }) as unknown as Response,
    ) as unknown as typeof fetch;

    const result = await refetchLinkAction({data: {id: 1}});
    expect(result.refetched).toBe(true);
  });

  it('should throw Unauthorized when not authenticated', async function () {
    for (const key of Object.keys(cookies)) {
      delete cookies[key];
    }

    try {
      await refetchLinkAction({data: {id: 1}});
      expect.fail('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Unauthorized');
    }
  });
});

describe('suggestTagsAction', function () {
  it('should call suggestTags with id', async function () {
    global.fetch = mock(
      async () =>
        ({
          ok: true,
          json: async () => [{id: 1, tag: 'suggested'}],
        }) as unknown as Response,
    ) as unknown as typeof fetch;

    const result = await suggestTagsAction({data: {id: 1}});
    expect(result).toContainEqual({id: 1, tag: 'suggested'});
  });

  it('should throw Unauthorized when not authenticated', async function () {
    for (const key of Object.keys(cookies)) {
      delete cookies[key];
    }

    try {
      await suggestTagsAction({data: {id: 1}});
      expect.fail('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Unauthorized');
    }
  });
});

describe('deleteLinkAction', function () {
  it('should call deleteLink with id', async function () {
    global.fetch = mock(
      async () =>
        ({
          ok: true,
          json: async () => ({id: 1, deleted: true}),
        }) as unknown as Response,
    ) as unknown as typeof fetch;

    const result = await deleteLinkAction({data: {id: 1}});
    expect(result.deleted).toBe(true);
  });

  it('should throw Unauthorized when not authenticated', async function () {
    for (const key of Object.keys(cookies)) {
      delete cookies[key];
    }

    try {
      await deleteLinkAction({data: {id: 1}});
      expect.fail('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Unauthorized');
    }
  });
});
