import {mock, describe, it, expect, beforeAll, afterAll, beforeEach} from 'bun:test';
import {Hono} from 'hono';
// Deep import rather than `@domain`: the barrel is mocked below, and
// error-handler.ts branches on `instanceof`, so the mock has to expose the
// same class identity the handler sees.
import {DomainValidationError, NotFoundError} from 'domain/src/lib/errors';

mock.module('env', () => ({parseEnv: () => ({API_KEY: 'test-key'})}));

const candidate = {
  kind: 'email',
  id: 'item-1',
  title: 'At 19, Ghost founder raises $11 million',
  url: 'https://example.com/ghost',
  source: 'TechCrunch Daily',
  summary: null,
  ingestedAt: new Date('2026-10-05T09:00:00Z'),
  openedAt: null,
  promoted: false,
  rank: 0.4,
};
const mockSearchHistoryCandidates = mock(async (_params: unknown) => [candidate] as any[]);

mock.module('@domain', () => ({
  DomainValidationError,
  NotFoundError,
  searchHistoryCandidates: mockSearchHistoryCandidates,
}));

type HistoryModule = typeof import('../../src/routes/history');
let historyRoutes: HistoryModule['historyRoutes'];
const originalApiKey = process.env.ANTHROPIC_API_KEY;

beforeAll(async function () {
  // Without a key the command never calls fetch, so this test stays offline.
  delete process.env.ANTHROPIC_API_KEY;
  const mod = await import('../../src/routes/history');
  historyRoutes = mod.historyRoutes;
});

afterAll(function () {
  if (originalApiKey === undefined) delete process.env.ANTHROPIC_API_KEY;
  else process.env.ANTHROPIC_API_KEY = originalApiKey;
});

function makeApp(): Hono {
  const app = new Hono();
  app.route('/', historyRoutes);
  return app;
}

const authHeader = {Authorization: 'Bearer test-key'};

describe('GET /api/history/search', function () {
  beforeEach(function () {
    mockSearchHistoryCandidates.mockClear();
  });

  it('should return 401 without a bearer token', async function () {
    const res = await makeApp().request('/api/history/search?q=local%20llm%20box');

    expect(res.status).toBe(401);
    expect(mockSearchHistoryCandidates).toHaveBeenCalledTimes(0);
  });

  it('should return 400 for an unsupported window', async function () {
    const res = await makeApp().request('/api/history/search?q=local%20llm%20box&days=14', {
      headers: authHeader,
    });

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid query parameters');
    expect(mockSearchHistoryCandidates).toHaveBeenCalledTimes(0);
  });

  it('should return 400 when the description is missing', async function () {
    const res = await makeApp().request('/api/history/search', {headers: authHeader});

    expect(res.status).toBe(400);
  });

  it('should return keyword-ranked results over a 30-day default window', async function () {
    const res = await makeApp().request('/api/history/search?q=local%20llm%20startup', {
      headers: authHeader,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.judged).toBe(false);
    expect(body.results).toEqual([
      {
        kind: 'email',
        id: 'item-1',
        title: 'At 19, Ghost founder raises $11 million',
        url: 'https://example.com/ghost',
        source: 'TechCrunch Daily',
        ingestedAt: '2026-10-05T09:00:00.000Z',
        openedAt: null,
        promoted: false,
        reason: null,
      },
    ]);
    expect(mockSearchHistoryCandidates).toHaveBeenCalledTimes(1);
    expect(mockSearchHistoryCandidates.mock.calls[0][0]).toMatchObject({
      days: 30,
      terms: ['local', 'llm', 'startup'],
    });
  });
});
