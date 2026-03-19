import {beforeAll, describe, expect, it, mock} from 'bun:test';

mock.module('@tanstack/react-start', () => ({
  createServerFn: () => ({
    inputValidator: () => ({
      handler: (fn: Function) => fn,
    }),
  }),
}));

mock.module('../../src/lib/session.server', () => ({
  getSession: mock(async () => ({authenticated: true})),
}));

mock.module('../../src/lib/init-client.server', () => ({
  initClientServer: mock(() => {}),
}));

mock.module('client', () => ({
  setSetting: mock(async (key: string, value: string) => ({key, value, set: true})),
}));

let setSettingAction: any;
let mockGetSession: any;
let mockSetSetting: any;

beforeAll(async function () {
  const mod = await import('../../src/lib/settings-actions');
  setSettingAction = mod.setSettingAction;

  const sessionMod = await import('../../src/lib/session.server');
  mockGetSession = sessionMod.getSession;

  const clientMod = await import('client');
  mockSetSetting = clientMod.setSetting;
});

describe('setSettingAction', function () {
  it('should call setSetting with key and value', async function () {
    mockSetSetting.mockClear();
    const result = await setSettingAction({data: {key: 'theme', value: 'dark'}});
    expect(mockSetSetting).toHaveBeenCalledWith('theme', 'dark');
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
