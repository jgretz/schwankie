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

let renameTagAction: any;
let mergeTagAction: any;
let deleteTagAction: any;
let mockGetSession: any;

beforeAll(async function () {
  const {init} = await import('client');
  init({apiUrl: 'http://localhost:3001', apiKey: 'test-key'});

  const mod = await import('../../src/lib/tag-actions');
  renameTagAction = mod.renameTagAction;
  mergeTagAction = mod.mergeTagAction;
  deleteTagAction = mod.deleteTagAction;

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

describe('renameTagAction', function () {
  it('should call renameTag with id and text', async function () {
    global.fetch = mock(
      async () =>
        ({
          ok: true,
          json: async () => ({id: 1, text: 'new-name'}),
        }) as unknown as Response,
    ) as unknown as typeof fetch;

    const result = await renameTagAction({data: {id: 1, text: 'new-name'}});
    expect(result).toEqual({id: 1, text: 'new-name'});
  });

  it('should throw Unauthorized when not authenticated', async function () {
    mockGetSession.mockClear();
    mockGetSession.mockImplementationOnce(async () => null);

    try {
      await renameTagAction({data: {id: 1, text: 'new-name'}});
      expect.fail('should have thrown');
    } catch (error: any) {
      expect(error.message).toContain('Unauthorized');
    }
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
    mockGetSession.mockClear();
    mockGetSession.mockImplementationOnce(async () => null);

    try {
      await mergeTagAction({data: {aliasId: 1, canonicalTagId: 2}});
      expect.fail('should have thrown');
    } catch (error: any) {
      expect(error.message).toContain('Unauthorized');
    }
  });
});

describe('deleteTagAction', function () {
  it('should call deleteTag with id', async function () {
    global.fetch = mock(
      async () =>
        ({
          ok: true,
          json: async () => ({id: 1, deleted: true}),
        }) as unknown as Response,
    ) as unknown as typeof fetch;

    const result = await deleteTagAction({data: {id: 1}});
    expect(result.deleted).toBe(true);
  });

  it('should throw Unauthorized when not authenticated', async function () {
    mockGetSession.mockClear();
    mockGetSession.mockImplementationOnce(async () => null);

    try {
      await deleteTagAction({data: {id: 1}});
      expect.fail('should have thrown');
    } catch (error: any) {
      expect(error.message).toContain('Unauthorized');
    }
  });
});
