import {mock, describe, it, expect, beforeAll, beforeEach} from 'bun:test';
import {Hono} from 'hono';

// Mock env module first, before any routes load
mock.module('env', () => ({parseEnv: () => ({API_KEY: 'test-key'})}));

const mockListDigestSourceItems = mock(async () => ({
  items: [] as unknown[],
  windowStart: '2026-07-26T11:00:00.000Z',
  windowEnd: '2026-07-27T11:00:00.000Z',
  count: 0,
}));
const mockGetDailySummary = mock(async (_date?: string) => null as any);
const mockListDailySummaryDates = mock(async () => [] as string[]);
const mockUpsertDailySummary = mock(async (_input?: unknown) => null as any);

mock.module('@domain', () => ({
  listDigestSourceItems: mockListDigestSourceItems,
  getDailySummary: mockGetDailySummary,
  listDailySummaryDates: mockListDailySummaryDates,
  upsertDailySummary: mockUpsertDailySummary,
  localSummaryDate: (now: Date) => now.toISOString().slice(0, 10),
  digestWindow: (now: Date, hours: number) => ({
    windowStart: new Date(now.getTime() - hours * 3600 * 1000),
    windowEnd: now,
  }),
}));

type DigestModule = typeof import('../../src/routes/digest');
let digestRoutes: DigestModule['digestRoutes'];

beforeAll(async function () {
  const mod = await import('../../src/routes/digest');
  digestRoutes = mod.digestRoutes;
});

function makeApp(): Hono {
  const app = new Hono();
  app.route('/', digestRoutes);
  return app;
}

const authHeader = {Authorization: 'Bearer test-key'};

const topic = {
  rank: 1,
  title: 'Model releases',
  body: 'Two labs shipped.',
  itemCount: 2,
  links: [{url: 'https://example.com/a', title: 'A', source: 'Feed'}],
};

describe('GET /api/digest/source-items', function () {
  beforeEach(function () {
    mockListDigestSourceItems.mockReset();
  });

  it('should return 200 with the window', async function () {
    const result = {
      items: [{url: 'https://example.com/a', title: 'A', source: 'F', sourceKind: 'rss'}],
      windowStart: '2026-07-26T11:00:00.000Z',
      windowEnd: '2026-07-27T11:00:00.000Z',
      count: 1,
    };
    mockListDigestSourceItems.mockResolvedValue(result);
    const app = makeApp();

    const res = await app.request('/api/digest/source-items?hours=24', {headers: authHeader});

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(result);
  });

  it('should return a json object, not a bare array', async function () {
    mockListDigestSourceItems.mockResolvedValue({
      items: [],
      windowStart: 'a',
      windowEnd: 'b',
      count: 0,
    });
    const app = makeApp();

    const body = await (
      await app.request('/api/digest/source-items', {headers: authHeader})
    ).json();

    expect(Array.isArray(body)).toBe(false);
    expect(body).toHaveProperty('items');
  });

  it('should default hours to 24 when omitted', async function () {
    mockListDigestSourceItems.mockResolvedValue({
      items: [],
      windowStart: 'a',
      windowEnd: 'b',
      count: 0,
    });
    const app = makeApp();

    await app.request('/api/digest/source-items', {headers: authHeader});

    expect(mockListDigestSourceItems).toHaveBeenCalledWith({hours: 24});
  });

  it('should return 400 on an out-of-range hours', async function () {
    const app = makeApp();

    const res = await app.request('/api/digest/source-items?hours=0', {headers: authHeader});

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid query parameters');
  });

  it('should return 401 without auth', async function () {
    const app = makeApp();

    expect((await app.request('/api/digest/source-items')).status).toBe(401);
  });
});

describe('GET /api/digest/daily-summary', function () {
  beforeEach(function () {
    mockGetDailySummary.mockReset();
  });

  it('should return 200 with the summary', async function () {
    const summary = {summaryDate: '2026-07-27', topics: [topic], itemCount: 2};
    mockGetDailySummary.mockResolvedValue(summary);
    const app = makeApp();

    const res = await app.request('/api/digest/daily-summary?date=2026-07-27', {
      headers: authHeader,
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(summary);
  });

  it('should ask for the latest when no date is given', async function () {
    mockGetDailySummary.mockResolvedValue({summaryDate: '2026-07-27'});
    const app = makeApp();

    await app.request('/api/digest/daily-summary', {headers: authHeader});

    expect(mockGetDailySummary).toHaveBeenCalledWith(undefined);
  });

  it('should return 404 when the date has no digest', async function () {
    mockGetDailySummary.mockResolvedValue(null);
    const app = makeApp();

    const res = await app.request('/api/digest/daily-summary?date=2026-01-01', {
      headers: authHeader,
    });

    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe('Daily summary not found');
  });

  it('should return 400 on a malformed date', async function () {
    const app = makeApp();

    const res = await app.request('/api/digest/daily-summary?date=27-07-2026', {
      headers: authHeader,
    });

    expect(res.status).toBe(400);
  });

  it('should return 401 without auth', async function () {
    const app = makeApp();

    expect((await app.request('/api/digest/daily-summary')).status).toBe(401);
  });
});

describe('GET /api/digest/daily-summary/dates', function () {
  beforeEach(function () {
    mockListDailySummaryDates.mockReset();
  });

  it('should return 200 with the dates', async function () {
    mockListDailySummaryDates.mockResolvedValue(['2026-07-27', '2026-07-26']);
    const app = makeApp();

    const res = await app.request('/api/digest/daily-summary/dates', {headers: authHeader});

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({dates: ['2026-07-27', '2026-07-26']});
  });

  it('should not be shadowed by the summary route', async function () {
    mockListDailySummaryDates.mockResolvedValue(['2026-07-27']);
    const app = makeApp();

    await app.request('/api/digest/daily-summary/dates', {headers: authHeader});

    expect(mockListDailySummaryDates).toHaveBeenCalled();
    expect(mockGetDailySummary).not.toHaveBeenCalled();
  });

  it('should return 401 without auth', async function () {
    const app = makeApp();

    expect((await app.request('/api/digest/daily-summary/dates')).status).toBe(401);
  });
});

describe('POST /api/digest/daily-summary', function () {
  beforeEach(function () {
    mockUpsertDailySummary.mockReset();
  });

  it('should return 201 with the stored summary', async function () {
    mockUpsertDailySummary.mockResolvedValue({summaryDate: '2026-07-27', topics: [topic]});
    const app = makeApp();

    const res = await app.request('/api/digest/daily-summary', {
      method: 'POST',
      headers: {...authHeader, 'Content-Type': 'application/json'},
      body: JSON.stringify({topics: [topic], notable: 'Model releases dominated.'}),
    });

    expect(res.status).toBe(201);
  });

  it('should accept an empty window and write an empty row', async function () {
    mockUpsertDailySummary.mockResolvedValue({summaryDate: '2026-07-27', topics: []});
    const app = makeApp();

    const res = await app.request('/api/digest/daily-summary', {
      method: 'POST',
      headers: {...authHeader, 'Content-Type': 'application/json'},
      body: JSON.stringify({topics: [], notable: 'A quiet window.'}),
    });

    expect(res.status).toBe(201);
    expect(mockUpsertDailySummary.mock.calls[0]![0]).toMatchObject({topics: [], itemCount: 0});
  });

  it('should derive itemCount from the topics when omitted', async function () {
    mockUpsertDailySummary.mockResolvedValue({});
    const app = makeApp();

    await app.request('/api/digest/daily-summary', {
      method: 'POST',
      headers: {...authHeader, 'Content-Type': 'application/json'},
      body: JSON.stringify({topics: [topic, {...topic, rank: 2, itemCount: 3}]}),
    });

    expect(mockUpsertDailySummary.mock.calls[0]![0]).toMatchObject({itemCount: 5});
  });

  it('should return 400 when topics are missing', async function () {
    const app = makeApp();

    const res = await app.request('/api/digest/daily-summary', {
      method: 'POST',
      headers: {...authHeader, 'Content-Type': 'application/json'},
      body: JSON.stringify({notable: 'no topics key'}),
    });

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid request body');
  });

  it('should return 400 when a topic is malformed', async function () {
    const app = makeApp();

    const res = await app.request('/api/digest/daily-summary', {
      method: 'POST',
      headers: {...authHeader, 'Content-Type': 'application/json'},
      body: JSON.stringify({topics: [{rank: 'first', title: 'x'}]}),
    });

    expect(res.status).toBe(400);
  });

  it('should return 401 without auth', async function () {
    const app = makeApp();

    const res = await app.request('/api/digest/daily-summary', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({topics: []}),
    });

    expect(res.status).toBe(401);
  });
});
