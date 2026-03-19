import {mock, describe, it, expect, beforeAll, beforeEach} from 'bun:test';
import {Hono} from 'hono';

// Mock env module first, before any routes load
mock.module('env', () => ({parseEnv: () => ({API_KEY: 'test-key'})}));

// Mock @domain exports
const mockGetLink = mock(async () => null as any);
const mockListLinks = mock(async () => ({links: [], total: 0}));
const mockCreateLink = mock(async () => null as any);
const mockUpdateLink = mock(async () => null as any);
const mockDeleteLink = mock(async () => false);
const mockResetEnrichment = mock(async () => false);

mock.module('@domain', () => ({
  getLink: mockGetLink,
  listLinks: mockListLinks,
  createLink: mockCreateLink,
  updateLink: mockUpdateLink,
  deleteLink: mockDeleteLink,
  resetEnrichment: mockResetEnrichment,
}));

// Mock API commands
const mockRefetchLink = mock(async () => null as any);
const mockSuggestTags = mock(async () => null as any);

mock.module('../../src/commands/refetch-link', () => ({
  refetchLink: mockRefetchLink,
}));

mock.module('../../src/commands/suggest-tags', () => ({
  suggestTags: mockSuggestTags,
}));

type LinksModule = typeof import('../../src/routes/links');
let linksRoutes: LinksModule['linksRoutes'];

beforeAll(async function () {
  const mod = await import('../../src/routes/links');
  linksRoutes = mod.linksRoutes;
});

function makeApp(): Hono {
  const app = new Hono();
  app.route('/', linksRoutes);
  return app;
}

const authHeader = {Authorization: 'Bearer test-key'};

describe('GET /api/links/:id', function () {
  beforeEach(function () {
    mockGetLink.mockReset();
  });

  it('should return 400 when id is not a number', async function () {
    const app = makeApp();
    const res = await app.request('/api/links/abc');
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({error: 'Invalid link ID'});
    expect(mockGetLink).not.toHaveBeenCalled();
  });

  it('should return 404 when link not found', async function () {
    mockGetLink.mockResolvedValue(null);
    const app = makeApp();
    const res = await app.request('/api/links/99999');
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({error: 'Link not found'});
    expect(mockGetLink).toHaveBeenCalledWith(99999);
  });

  it('should return 200 with link data when found', async function () {
    const link = {
      id: 1,
      url: 'https://example.com',
      title: 'Test Link',
      description: null,
      imageUrl: null,
      status: 'saved',
      content: null,
      createDate: new Date('2024-01-01'),
      updateDate: new Date('2024-01-01'),
      tags: [{id: 1, text: 'test-tag'}],
    };
    mockGetLink.mockResolvedValue(link);
    const app = makeApp();
    const res = await app.request('/api/links/1');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(1);
    expect(body.title).toBe('Test Link');
    expect(body.url).toBe('https://example.com');
  });
});

describe('GET /api/links', function () {
  beforeEach(function () {
    mockListLinks.mockReset();
  });

  it('should return 200 with links list', async function () {
    const result = {links: [{id: 1, title: 'Link 1'}], total: 1};
    mockListLinks.mockResolvedValue(result);
    const app = makeApp();
    const res = await app.request('/api/links');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(result);
  });

  it('should return 400 on invalid query params', async function () {
    const app = makeApp();
    const res = await app.request('/api/links?limit=0');
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid query parameters');
  });
});

describe('POST /api/links', function () {
  beforeEach(function () {
    mockCreateLink.mockReset();
  });

  it('should return 401 without auth header', async function () {
    const app = makeApp();
    const res = await app.request('/api/links', {
      method: 'POST',
      body: JSON.stringify({url: 'https://example.com', title: 'Test'}),
      headers: {'Content-Type': 'application/json'},
    });
    expect(res.status).toBe(401);
  });

  it('should return 400 on invalid body', async function () {
    const app = makeApp();
    const res = await app.request('/api/links', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {...authHeader, 'Content-Type': 'application/json'},
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid request body');
  });

  it('should return 201 on success', async function () {
    const created = {
      id: 1,
      url: 'https://example.com',
      title: 'Test',
      status: 'saved',
      tags: [],
    };
    mockCreateLink.mockResolvedValue(created);
    const app = makeApp();
    const res = await app.request('/api/links', {
      method: 'POST',
      body: JSON.stringify({url: 'https://example.com', title: 'Test'}),
      headers: {...authHeader, 'Content-Type': 'application/json'},
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe(1);
  });
});

describe('PATCH /api/links/:id', function () {
  beforeEach(function () {
    mockUpdateLink.mockReset();
  });

  it('should return 401 without auth header', async function () {
    const app = makeApp();
    const res = await app.request('/api/links/1', {
      method: 'PATCH',
      body: JSON.stringify({title: 'Updated'}),
      headers: {'Content-Type': 'application/json'},
    });
    expect(res.status).toBe(401);
  });

  it('should return 400 on invalid id', async function () {
    const app = makeApp();
    const res = await app.request('/api/links/abc', {
      method: 'PATCH',
      body: JSON.stringify({title: 'Updated'}),
      headers: {...authHeader, 'Content-Type': 'application/json'},
    });
    expect(res.status).toBe(400);
  });

  it('should return 400 on invalid body', async function () {
    mockUpdateLink.mockResolvedValue({id: 1, title: 'Link'} as any);
    const app = makeApp();
    const res = await app.request('/api/links/1', {
      method: 'PATCH',
      body: JSON.stringify({url: 'not-a-url'}),
      headers: {...authHeader, 'Content-Type': 'application/json'},
    });
    expect(res.status).toBe(400);
  });

  it('should return 404 when link not found', async function () {
    mockUpdateLink.mockResolvedValue(null);
    const app = makeApp();
    const res = await app.request('/api/links/99999', {
      method: 'PATCH',
      body: JSON.stringify({title: 'Updated'}),
      headers: {...authHeader, 'Content-Type': 'application/json'},
    });
    expect(res.status).toBe(404);
  });

  it('should return 200 on success', async function () {
    const updated = {id: 1, title: 'Updated', status: 'saved'};
    mockUpdateLink.mockResolvedValue(updated);
    const app = makeApp();
    const res = await app.request('/api/links/1', {
      method: 'PATCH',
      body: JSON.stringify({title: 'Updated'}),
      headers: {...authHeader, 'Content-Type': 'application/json'},
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.title).toBe('Updated');
  });
});

describe('DELETE /api/links/:id', function () {
  beforeEach(function () {
    mockDeleteLink.mockReset();
  });

  it('should return 401 without auth header', async function () {
    const app = makeApp();
    const res = await app.request('/api/links/1', {method: 'DELETE'});
    expect(res.status).toBe(401);
  });

  it('should return 400 on invalid id', async function () {
    const app = makeApp();
    const res = await app.request('/api/links/abc', {
      method: 'DELETE',
      headers: authHeader,
    });
    expect(res.status).toBe(400);
  });

  it('should return 404 when link not found', async function () {
    mockDeleteLink.mockResolvedValue(false);
    const app = makeApp();
    const res = await app.request('/api/links/99999', {
      method: 'DELETE',
      headers: authHeader,
    });
    expect(res.status).toBe(404);
  });

  it('should return 200 on success', async function () {
    mockDeleteLink.mockResolvedValue(true);
    const app = makeApp();
    const res = await app.request('/api/links/1', {
      method: 'DELETE',
      headers: authHeader,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({deleted: true});
  });
});

describe('PATCH /api/links/:id/reset-enrichment', function () {
  beforeEach(function () {
    mockResetEnrichment.mockReset();
  });

  it('should return 401 without auth header', async function () {
    const app = makeApp();
    const res = await app.request('/api/links/1/reset-enrichment', {method: 'PATCH'});
    expect(res.status).toBe(401);
  });

  it('should return 400 on invalid id', async function () {
    const app = makeApp();
    const res = await app.request('/api/links/abc/reset-enrichment', {
      method: 'PATCH',
      headers: authHeader,
    });
    expect(res.status).toBe(400);
  });

  it('should return 404 when link not found', async function () {
    mockResetEnrichment.mockResolvedValue(false);
    const app = makeApp();
    const res = await app.request('/api/links/99999/reset-enrichment', {
      method: 'PATCH',
      headers: authHeader,
    });
    expect(res.status).toBe(404);
  });

  it('should return 200 on success', async function () {
    mockResetEnrichment.mockResolvedValue(true);
    const app = makeApp();
    const res = await app.request('/api/links/1/reset-enrichment', {
      method: 'PATCH',
      headers: authHeader,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({reset: true});
  });
});

describe('POST /api/links/:id/refetch', function () {
  beforeEach(function () {
    mockRefetchLink.mockReset();
  });

  it('should return 401 without auth header', async function () {
    const app = makeApp();
    const res = await app.request('/api/links/1/refetch', {method: 'POST'});
    expect(res.status).toBe(401);
  });

  it('should return 404 when link not found', async function () {
    mockRefetchLink.mockResolvedValue(null);
    const app = makeApp();
    const res = await app.request('/api/links/99999/refetch', {
      method: 'POST',
      headers: authHeader,
    });
    expect(res.status).toBe(404);
  });

  it('should return 200 on success', async function () {
    const result = {id: 1, status: 'saved'};
    mockRefetchLink.mockResolvedValue(result);
    const app = makeApp();
    const res = await app.request('/api/links/1/refetch', {
      method: 'POST',
      headers: authHeader,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(1);
  });
});

describe('POST /api/links/:id/suggest-tags', function () {
  beforeEach(function () {
    mockSuggestTags.mockReset();
  });

  it('should return 401 without auth header', async function () {
    const app = makeApp();
    const res = await app.request('/api/links/1/suggest-tags', {method: 'POST'});
    expect(res.status).toBe(401);
  });

  it('should return 404 when link not found', async function () {
    mockSuggestTags.mockResolvedValue(null);
    const app = makeApp();
    const res = await app.request('/api/links/99999/suggest-tags', {
      method: 'POST',
      headers: authHeader,
    });
    expect(res.status).toBe(404);
  });

  it('should return 200 on success', async function () {
    const result = {suggestions: ['tag1', 'tag2']};
    mockSuggestTags.mockResolvedValue(result);
    const app = makeApp();
    const res = await app.request('/api/links/1/suggest-tags', {
      method: 'POST',
      headers: authHeader,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.suggestions).toEqual(['tag1', 'tag2']);
  });
});
