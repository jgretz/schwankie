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

type LinkActions = typeof import('../../src/lib/link-actions');
type SessionServer = typeof import('../../src/lib/session.server');

let fetchMetadataAction: LinkActions['fetchMetadataAction'];
let createLinkAction: LinkActions['createLinkAction'];
let updateLinkAction: LinkActions['updateLinkAction'];
let resetEnrichmentAction: LinkActions['resetEnrichmentAction'];
let refetchLinkAction: LinkActions['refetchLinkAction'];
let suggestTagsAction: LinkActions['suggestTagsAction'];
let deleteLinkAction: LinkActions['deleteLinkAction'];
let createSession: SessionServer['createSession'];

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
          json: async () => ({title: 'Test Title', description: null, imageUrl: null}),
        }) as unknown as Response,
    ) as unknown as typeof fetch;

    const result = await fetchMetadataAction({data: {url: 'https://example.com'}});
    expect(result).toEqual({title: 'Test Title', description: null, imageUrl: null});
  });

  it('should throw error when not authenticated', async function () {
    for (const key of Object.keys(cookies)) {
      delete cookies[key];
    }

    await expect(fetchMetadataAction({data: {url: 'https://example.com'}})).rejects.toThrow(
      /^Unauthorized$/,
    );
  });
});

describe('createLinkAction', function () {
  it('should call createLink with data', async function () {
    global.fetch = mock(
      async () =>
        ({
          ok: true,
          json: async () => ({
            id: 1,
            url: 'https://example.com',
            title: 'Test',
            tags: [{id: 1, text: 'tag1'}],
          }),
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

    await expect(
      createLinkAction({data: {url: 'https://example.com', title: 'Test'}}),
    ).rejects.toThrow(/^Unauthorized$/);
  });
});

describe('updateLinkAction', function () {
  it('should call updateLink with id and rest of data', async function () {
    global.fetch = mock(
      async () =>
        ({
          ok: true,
          json: async () => ({id: 1, title: 'Updated', tags: [{id: 2, text: 'tag2'}]}),
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

    await expect(updateLinkAction({data: {id: 1, title: 'Updated'}})).rejects.toThrow(
      /^Unauthorized$/,
    );
  });
});

describe('resetEnrichmentAction', function () {
  it('should call resetEnrichment with id', async function () {
    global.fetch = mock(
      async () =>
        ({
          ok: true,
          json: async () => ({reset: true}),
        }) as unknown as Response,
    ) as unknown as typeof fetch;

    const result = await resetEnrichmentAction({data: {id: 1}});
    expect(result.reset).toBe(true);
  });

  it('should throw Unauthorized when not authenticated', async function () {
    for (const key of Object.keys(cookies)) {
      delete cookies[key];
    }

    await expect(resetEnrichmentAction({data: {id: 1}})).rejects.toThrow(/^Unauthorized$/);
  });
});

describe('refetchLinkAction', function () {
  it('should call refetchLink with id', async function () {
    // refetchLink resolves to the refreshed link itself, so the response body carries no
    // marker to assert on — the request URL is what proves the id reached the endpoint.
    const fetchMock = mock(
      async (_url: string, _init?: RequestInit) =>
        ({
          ok: true,
          json: async () => ({id: 1, title: 'Refetched'}),
        }) as unknown as Response,
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await refetchLinkAction({data: {id: 1}});

    expect(result.title).toBe('Refetched');
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:3001/api/links/1/refetch');
  });

  it('should throw Unauthorized when not authenticated', async function () {
    for (const key of Object.keys(cookies)) {
      delete cookies[key];
    }

    await expect(refetchLinkAction({data: {id: 1}})).rejects.toThrow(/^Unauthorized$/);
  });
});

describe('suggestTagsAction', function () {
  it('should call suggestTags with id', async function () {
    global.fetch = mock(
      async () =>
        ({
          ok: true,
          json: async () => ({tags: ['suggested']}),
        }) as unknown as Response,
    ) as unknown as typeof fetch;

    const result = await suggestTagsAction({data: {id: 1}});
    expect(result.tags).toContain('suggested');
  });

  it('should throw Unauthorized when not authenticated', async function () {
    for (const key of Object.keys(cookies)) {
      delete cookies[key];
    }

    await expect(suggestTagsAction({data: {id: 1}})).rejects.toThrow(/^Unauthorized$/);
  });
});

describe('deleteLinkAction', function () {
  it('should call deleteLink with id', async function () {
    global.fetch = mock(
      async () =>
        ({
          ok: true,
          json: async () => ({deleted: true}),
        }) as unknown as Response,
    ) as unknown as typeof fetch;

    const result = await deleteLinkAction({data: {id: 1}});
    expect(result.deleted).toBe(true);
  });

  it('should throw Unauthorized when not authenticated', async function () {
    for (const key of Object.keys(cookies)) {
      delete cookies[key];
    }

    await expect(deleteLinkAction({data: {id: 1}})).rejects.toThrow(/^Unauthorized$/);
  });
});
