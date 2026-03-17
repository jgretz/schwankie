import {mock, describe, it, expect, beforeAll, beforeEach} from 'bun:test';
import {Hono} from 'hono';

// mock.module must be called before the dynamic import of linksRoutes,
// so @domain is intercepted when links.ts loads.
const mockGetLink = mock(async (_id: number) => null as any);

mock.module('@domain', () => ({
  getLink: mockGetLink,
  listLinks: mock(async () => ({links: [], total: 0})),
  createLink: mock(async () => null),
  updateLink: mock(async () => null),
  deleteLink: mock(async () => null),
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

describe('GET /api/links/:id', function () {
  beforeEach(function () {
    mockGetLink.mockReset();
  });

  it('should return 400 when id is not a valid number', async function () {
    const app = makeApp();

    const res = await app.request('/api/links/abc');

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({error: 'Invalid link ID'});
    expect(mockGetLink).not.toHaveBeenCalled();
  });

  it('should return 404 when link does not exist', async function () {
    mockGetLink.mockResolvedValue(null);
    const app = makeApp();

    const res = await app.request('/api/links/99999');

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({error: 'Link not found'});
    expect(mockGetLink).toHaveBeenCalledWith(99999);
  });

  it('should return 200 with link and tags when found', async function () {
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
    expect(body.tags).toHaveLength(1);
    expect(body.tags[0].text).toBe('test-tag');
    expect(mockGetLink).toHaveBeenCalledWith(1);
  });
});
