import {mock, describe, it, expect, beforeAll, beforeEach} from 'bun:test';
import {Hono} from 'hono';

// Mock env module first
mock.module('env', () => ({parseEnv: () => ({API_KEY: 'test-key'})}));

// Mock metadata package
const mockExtractMetadata = mock(async () => ({
  title: 'Example',
  description: 'A site',
  url: 'https://example.com',
  imageUrl: null,
  tags: [],
}));

mock.module('metadata', () => ({
  extractMetadata: mockExtractMetadata,
}));

type MetadataModule = typeof import('../../src/routes/metadata');
let metadataRoutes: MetadataModule['metadataRoutes'];

beforeAll(async function () {
  const mod = await import('../../src/routes/metadata');
  metadataRoutes = mod.metadataRoutes;
});

function makeApp(): Hono {
  const app = new Hono();
  app.route('/api/metadata', metadataRoutes);
  return app;
}

const authHeader = {Authorization: 'Bearer test-key'};

describe('POST /api/metadata/fetch', function () {
  beforeEach(function () {
    mockExtractMetadata.mockReset();
  });

  it('should return 401 without Authorization header', async function () {
    const app = makeApp();
    const res = await app.request('/api/metadata/fetch', {
      method: 'POST',
      body: JSON.stringify({url: 'https://example.com'}),
      headers: {'Content-Type': 'application/json'},
    });
    expect(res.status).toBe(401);
  });

  it('should return 400 when url field is missing', async function () {
    const app = makeApp();
    const res = await app.request('/api/metadata/fetch', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {...authHeader, 'Content-Type': 'application/json'},
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({error: 'Invalid URL'});
  });

  it('should return 400 when url is not a valid URL', async function () {
    const app = makeApp();
    const res = await app.request('/api/metadata/fetch', {
      method: 'POST',
      body: JSON.stringify({url: 'not-a-url'}),
      headers: {...authHeader, 'Content-Type': 'application/json'},
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({error: 'Invalid URL'});
  });

  it('should return 400 on malformed JSON', async function () {
    const app = makeApp();
    const res = await app.request('/api/metadata/fetch', {
      method: 'POST',
      body: '{invalid json',
      headers: {...authHeader, 'Content-Type': 'application/json'},
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({error: 'Invalid URL'});
  });

  it('should return 200 with metadata on success', async function () {
    mockExtractMetadata.mockResolvedValue({
      title: 'Example',
      description: 'A site',
      url: 'https://example.com',
      imageUrl: null,
      tags: [],
    });
    const app = makeApp();
    const res = await app.request('/api/metadata/fetch', {
      method: 'POST',
      body: JSON.stringify({url: 'https://example.com'}),
      headers: {...authHeader, 'Content-Type': 'application/json'},
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      title: 'Example',
      description: 'A site',
      url: 'https://example.com',
      imageUrl: null,
      tags: [],
    });
    expect(mockExtractMetadata).toHaveBeenCalledWith('https://example.com');
  });
});
