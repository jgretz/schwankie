import {mock, describe, it, expect, beforeAll, beforeEach} from 'bun:test';
import {Hono} from 'hono';

// Mock env module first
mock.module('env', () => ({parseEnv: () => ({API_KEY: 'test-key'})}));

// Mock @domain exports
// Includes all symbols needed by links, tags, and settings routes
const mockGetLink = mock(async () => null as any);
const mockListLinks = mock(async () => ({links: [], total: 0}));
const mockCreateLink = mock(async () => null as any);
const mockUpdateLink = mock(async () => null as any);
const mockDeleteLink = mock(async () => false);
const mockResetEnrichment = mock(async () => false);
const mockListTags = mock(async () => ({tags: [], total: 0}));
const mockMergeTag = mock(async () => false);
const mockMarkTagNormalized = mock(async () => false);
const mockRenameTag = mock(async () => false);
const mockDeleteTag = mock(async () => false);
const mockNormalizeTag = mock(async () => '');
const mockGetSetting = mock(async () => null as any);
const mockSetSetting = mock(async () => undefined);
const mockResolveTagMinCount = mock(async () => {
  const value = await mockGetSetting('tagCountFloor');
  const floor = value ? Number(value) : 1;
  return Number.isNaN(floor) ? 1 : floor;
});
const mockValidateSettingValue = mock(() => ({success: true}));

mock.module('@domain', () => ({
  getLink: mockGetLink,
  listLinks: mockListLinks,
  createLink: mockCreateLink,
  updateLink: mockUpdateLink,
  deleteLink: mockDeleteLink,
  resetEnrichment: mockResetEnrichment,
  listTags: mockListTags,
  mergeTag: mockMergeTag,
  markTagNormalized: mockMarkTagNormalized,
  renameTag: mockRenameTag,
  deleteTag: mockDeleteTag,
  normalizeTag: mockNormalizeTag,
  getSetting: mockGetSetting,
  setSetting: mockSetSetting,
  resolveTagMinCount: mockResolveTagMinCount,
  validateSettingValue: mockValidateSettingValue,
}));

type TagsModule = typeof import('../../src/routes/tags');
let tagsRouter: TagsModule['tagsRouter'];

beforeAll(async function () {
  const mod = await import('../../src/routes/tags');
  tagsRouter = mod.tagsRouter;
});

function makeApp(): Hono {
  const app = new Hono();
  app.route('/', tagsRouter);
  return app;
}

const authHeader = {Authorization: 'Bearer test-key'};

describe('GET /api/tags', function () {
  beforeEach(function () {
    mockListTags.mockReset();
    mockGetSetting.mockReset();
  });

  it('should return 200 with tags list', async function () {
    const result = {tags: [{id: 1, text: 'tag1'}], total: 1};
    mockListTags.mockResolvedValue(result);
    mockGetSetting.mockResolvedValue('1');
    const app = makeApp();
    const res = await app.request('/api/tags');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(result);
  });

  it('should call getSetting for tagCountFloor when no special flags', async function () {
    mockListTags.mockResolvedValue({tags: [], total: 0});
    mockGetSetting.mockResolvedValue('1');
    const app = makeApp();
    await app.request('/api/tags');
    expect(mockResolveTagMinCount).toHaveBeenCalled();
  });

  it('should skip tagCountFloor when needs_normalization=true', async function () {
    mockListTags.mockResolvedValue({tags: [], total: 0});
    const app = makeApp();
    await app.request('/api/tags?needs_normalization=true');
    expect(mockGetSetting).not.toHaveBeenCalled();
  });
});

describe('POST /api/tags/:id/merge', function () {
  beforeEach(function () {
    mockMergeTag.mockReset();
  });

  it('should return 401 without auth header', async function () {
    const app = makeApp();
    const res = await app.request('/api/tags/1/merge', {
      method: 'POST',
      body: JSON.stringify({canonicalTagId: 2}),
      headers: {'Content-Type': 'application/json'},
    });
    expect(res.status).toBe(401);
  });

  it('should return 400 on invalid id', async function () {
    const app = makeApp();
    const res = await app.request('/api/tags/abc/merge', {
      method: 'POST',
      body: JSON.stringify({canonicalTagId: 2}),
      headers: {...authHeader, 'Content-Type': 'application/json'},
    });
    expect(res.status).toBe(400);
  });

  it('should return 400 on invalid body', async function () {
    const app = makeApp();
    const res = await app.request('/api/tags/1/merge', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {...authHeader, 'Content-Type': 'application/json'},
    });
    expect(res.status).toBe(400);
  });

  it('should return 404 when merge returns false', async function () {
    mockMergeTag.mockResolvedValue(false);
    const app = makeApp();
    const res = await app.request('/api/tags/1/merge', {
      method: 'POST',
      body: JSON.stringify({canonicalTagId: 2}),
      headers: {...authHeader, 'Content-Type': 'application/json'},
    });
    expect(res.status).toBe(404);
  });

  it('should return 200 on success', async function () {
    mockMergeTag.mockResolvedValue(true);
    const app = makeApp();
    const res = await app.request('/api/tags/1/merge', {
      method: 'POST',
      body: JSON.stringify({canonicalTagId: 2}),
      headers: {...authHeader, 'Content-Type': 'application/json'},
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({merged: true});
  });
});

describe('PATCH /api/tags/:id/normalize', function () {
  beforeEach(function () {
    mockMarkTagNormalized.mockReset();
  });

  it('should return 401 without auth header', async function () {
    const app = makeApp();
    const res = await app.request('/api/tags/1/normalize', {method: 'PATCH'});
    expect(res.status).toBe(401);
  });

  it('should return 400 on invalid id', async function () {
    const app = makeApp();
    const res = await app.request('/api/tags/abc/normalize', {
      method: 'PATCH',
      headers: authHeader,
    });
    expect(res.status).toBe(400);
  });

  it('should return 404 when not found', async function () {
    mockMarkTagNormalized.mockResolvedValue(false);
    const app = makeApp();
    const res = await app.request('/api/tags/99999/normalize', {
      method: 'PATCH',
      headers: authHeader,
    });
    expect(res.status).toBe(404);
  });

  it('should return 200 on success', async function () {
    mockMarkTagNormalized.mockResolvedValue(true);
    const app = makeApp();
    const res = await app.request('/api/tags/1/normalize', {
      method: 'PATCH',
      headers: authHeader,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({normalized: true});
  });
});

describe('PATCH /api/tags/:id', function () {
  beforeEach(function () {
    mockRenameTag.mockReset();
  });

  it('should return 401 without auth header', async function () {
    const app = makeApp();
    const res = await app.request('/api/tags/1', {
      method: 'PATCH',
      body: JSON.stringify({text: 'new-name'}),
      headers: {'Content-Type': 'application/json'},
    });
    expect(res.status).toBe(401);
  });

  it('should return 400 on invalid id', async function () {
    const app = makeApp();
    const res = await app.request('/api/tags/abc', {
      method: 'PATCH',
      body: JSON.stringify({text: 'new-name'}),
      headers: {...authHeader, 'Content-Type': 'application/json'},
    });
    expect(res.status).toBe(400);
  });

  it('should return 400 on invalid body', async function () {
    const app = makeApp();
    const res = await app.request('/api/tags/1', {
      method: 'PATCH',
      body: JSON.stringify({}),
      headers: {...authHeader, 'Content-Type': 'application/json'},
    });
    expect(res.status).toBe(400);
  });

  it('should return 404 when not found', async function () {
    mockRenameTag.mockResolvedValue(false);
    const app = makeApp();
    const res = await app.request('/api/tags/99999', {
      method: 'PATCH',
      body: JSON.stringify({text: 'new-name'}),
      headers: {...authHeader, 'Content-Type': 'application/json'},
    });
    expect(res.status).toBe(404);
  });

  it('should return 200 on success', async function () {
    mockRenameTag.mockResolvedValue(true);
    const app = makeApp();
    const res = await app.request('/api/tags/1', {
      method: 'PATCH',
      body: JSON.stringify({text: 'new-name'}),
      headers: {...authHeader, 'Content-Type': 'application/json'},
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({renamed: true});
  });
});

describe('DELETE /api/tags/:id', function () {
  beforeEach(function () {
    mockDeleteTag.mockReset();
  });

  it('should return 401 without auth header', async function () {
    const app = makeApp();
    const res = await app.request('/api/tags/1', {method: 'DELETE'});
    expect(res.status).toBe(401);
  });

  it('should return 400 on invalid id', async function () {
    const app = makeApp();
    const res = await app.request('/api/tags/abc', {
      method: 'DELETE',
      headers: authHeader,
    });
    expect(res.status).toBe(400);
  });

  it('should return 404 when not found', async function () {
    mockDeleteTag.mockResolvedValue(false);
    const app = makeApp();
    const res = await app.request('/api/tags/99999', {
      method: 'DELETE',
      headers: authHeader,
    });
    expect(res.status).toBe(404);
  });

  it('should return 200 on success', async function () {
    mockDeleteTag.mockResolvedValue(true);
    const app = makeApp();
    const res = await app.request('/api/tags/1', {
      method: 'DELETE',
      headers: authHeader,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({deleted: true});
  });
});
