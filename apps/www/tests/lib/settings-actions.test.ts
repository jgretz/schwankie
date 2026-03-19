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

let setSettingAction: any;
let mockGetSession: any;

beforeAll(async function () {
  const {init} = await import('client');
  init({apiUrl: 'http://localhost:3001', apiKey: 'test-key'});

  const mod = await import('../../src/lib/settings-actions');
  setSettingAction = mod.setSettingAction;

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
    mockGetSession.mockClear();
    mockGetSession.mockImplementationOnce(async () => null);

    try {
      await setSettingAction({data: {key: 'theme', value: 'dark'}});
      expect.fail('should have thrown');
    } catch (error: any) {
      expect(error.message).toContain('Unauthorized');
    }
  });
});
