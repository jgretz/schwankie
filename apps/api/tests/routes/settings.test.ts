import {mock, describe, it, expect, beforeAll, beforeEach} from 'bun:test';
import {Hono} from 'hono';

// Mock env module first
mock.module('env', () => ({parseEnv: () => ({API_KEY: 'test-key'})}));

// Mock @domain exports
const mockGetSetting = mock(async () => null as any);
const mockSetSetting = mock(async () => undefined);

mock.module('@domain', () => ({
  getSetting: mockGetSetting,
  setSetting: mockSetSetting,
}));

type SettingsModule = typeof import('../../src/routes/settings');
let settingsRouter: SettingsModule['settingsRouter'];

beforeAll(async function () {
  const mod = await import('../../src/routes/settings');
  settingsRouter = mod.settingsRouter;
});

function makeApp(): Hono {
  const app = new Hono();
  app.route('/', settingsRouter);
  return app;
}

const authHeader = {Authorization: 'Bearer test-key'};

describe('GET /api/settings/:key', function () {
  beforeEach(function () {
    mockGetSetting.mockReset();
  });

  it('should return 404 when setting not found', async function () {
    mockGetSetting.mockResolvedValue(null);
    const app = makeApp();
    const res = await app.request('/api/settings/nonexistent');
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({error: 'Setting not found'});
  });

  it('should return 200 with key and value when found', async function () {
    mockGetSetting.mockResolvedValue('123');
    const app = makeApp();
    const res = await app.request('/api/settings/tagCountFloor');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({key: 'tagCountFloor', value: '123'});
  });
});

describe('PUT /api/settings/:key', function () {
  beforeEach(function () {
    mockSetSetting.mockReset();
  });

  it('should return 401 without auth header', async function () {
    const app = makeApp();
    const res = await app.request('/api/settings/tagCountFloor', {
      method: 'PUT',
      body: JSON.stringify({value: '5'}),
      headers: {'Content-Type': 'application/json'},
    });
    expect(res.status).toBe(401);
  });

  it('should return 400 on missing value', async function () {
    const app = makeApp();
    const res = await app.request('/api/settings/tagCountFloor', {
      method: 'PUT',
      body: JSON.stringify({}),
      headers: {...authHeader, 'Content-Type': 'application/json'},
    });
    expect(res.status).toBe(400);
  });

  it('should return 200 on success and call setSetting', async function () {
    mockSetSetting.mockResolvedValue(undefined);
    const app = makeApp();
    const res = await app.request('/api/settings/tagCountFloor', {
      method: 'PUT',
      body: JSON.stringify({value: '5'}),
      headers: {...authHeader, 'Content-Type': 'application/json'},
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({key: 'tagCountFloor', value: '5'});
    expect(mockSetSetting).toHaveBeenCalledWith('tagCountFloor', '5');
  });
});
