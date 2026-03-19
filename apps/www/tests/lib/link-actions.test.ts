import {afterEach, beforeAll, beforeEach, describe, expect, it, mock} from 'bun:test';

const originalFetch = global.fetch;

mock.module('@tanstack/react-start', () => ({
  createServerFn: () => ({
    inputValidator: () => ({
      handler: (fn: Function) => fn,
    }),
  }),
}));

mock.module('../../src/lib/session.server', () => ({
  getSession: mock(async () => ({authenticated: true})),
  createSession: mock(async () => {}),
  destroySession: mock(async () => {}),
}));

mock.module('../../src/lib/init-client.server', () => ({
  initClientServer: mock(() => {}),
}));

let fetchMetadataAction: any;
let createLinkAction: any;
let updateLinkAction: any;
let resetEnrichmentAction: any;
let refetchLinkAction: any;
let suggestTagsAction: any;
let deleteLinkAction: any;
let mockGetSession: any;

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
  mockGetSession = sessionMod.getSession;
});

afterEach(function () {
  global.fetch = originalFetch;
});

beforeEach(async function () {
  global.fetch = originalFetch;
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

  it('should throw Unauthorized when not authenticated', async function () {
    mockGetSession.mockClear();
    mockGetSession.mockImplementationOnce(async () => null);

    try {
      await fetchMetadataAction({data: {url: 'https://example.com'}});
      expect.fail('should have thrown');
    } catch (error: any) {
      expect(error.message).toContain('Unauthorized');
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
    mockGetSession.mockClear();
    mockGetSession.mockImplementationOnce(async () => null);

    try {
      await createLinkAction({data: {url: 'https://example.com', title: 'Test'}});
      expect.fail('should have thrown');
    } catch (error: any) {
      expect(error.message).toContain('Unauthorized');
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
    mockGetSession.mockClear();
    mockGetSession.mockImplementationOnce(async () => null);

    try {
      await updateLinkAction({data: {id: 1, title: 'Updated'}});
      expect.fail('should have thrown');
    } catch (error: any) {
      expect(error.message).toContain('Unauthorized');
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
    mockGetSession.mockClear();
    mockGetSession.mockImplementationOnce(async () => null);

    try {
      await resetEnrichmentAction({data: {id: 1}});
      expect.fail('should have thrown');
    } catch (error: any) {
      expect(error.message).toContain('Unauthorized');
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
    mockGetSession.mockClear();
    mockGetSession.mockImplementationOnce(async () => null);

    try {
      await refetchLinkAction({data: {id: 1}});
      expect.fail('should have thrown');
    } catch (error: any) {
      expect(error.message).toContain('Unauthorized');
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
    mockGetSession.mockClear();
    mockGetSession.mockImplementationOnce(async () => null);

    try {
      await suggestTagsAction({data: {id: 1}});
      expect.fail('should have thrown');
    } catch (error: any) {
      expect(error.message).toContain('Unauthorized');
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
    mockGetSession.mockClear();
    mockGetSession.mockImplementationOnce(async () => null);

    try {
      await deleteLinkAction({data: {id: 1}});
      expect.fail('should have thrown');
    } catch (error: any) {
      expect(error.message).toContain('Unauthorized');
    }
  });
});
