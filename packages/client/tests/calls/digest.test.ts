import {describe, it, expect, beforeEach, afterEach} from 'bun:test';
import {init, reset} from '../../src/config';
import {fetchDigestSourceItems} from '../../src/calls/fetch-digest-source-items';
import {fetchDailySummary} from '../../src/calls/fetch-daily-summary';
import {fetchDailySummaryDates} from '../../src/calls/fetch-daily-summary-dates';
import {upsertDailySummary} from '../../src/calls/upsert-daily-summary';

const TEST_API_URL = 'http://localhost:3001';
const TEST_API_KEY = 'test-key';

const originalFetch = global.fetch as any;

beforeEach(() => {
  init({apiUrl: TEST_API_URL, apiKey: TEST_API_KEY});
  global.fetch = originalFetch;
});

afterEach(() => {
  reset();
  global.fetch = originalFetch;
});

type Captured = {url: string; init: RequestInit};

function captureFetch(body: unknown, status = 200): Captured {
  const captured: Captured = {url: '', init: {}};
  global.fetch = (async (url: string, requestInit: RequestInit) => {
    captured.url = url;
    captured.init = requestInit;
    return new Response(JSON.stringify(body), {
      status,
      headers: {'Content-Type': 'application/json'},
    });
  }) as any;
  return captured;
}

const topic = {
  rank: 1,
  title: 'Model releases',
  body: 'Two labs shipped.',
  itemCount: 2,
  links: [{url: 'https://example.com/a', title: 'A', source: 'Feed'}],
};

describe('fetchDigestSourceItems', () => {
  it('should request the default window with no query string', async () => {
    const captured = captureFetch({items: [], windowStart: 'a', windowEnd: 'b', count: 0});

    await fetchDigestSourceItems();

    expect(captured.url).toBe(`${TEST_API_URL}/api/digest/source-items`);
  });

  it('should pass hours through as a query param', async () => {
    const captured = captureFetch({items: [], windowStart: 'a', windowEnd: 'b', count: 0});

    await fetchDigestSourceItems({hours: 48});

    expect(captured.url).toBe(`${TEST_API_URL}/api/digest/source-items?hours=48`);
  });

  it('should return the parsed window', async () => {
    captureFetch({
      items: [{url: 'https://example.com/a', title: 'A', source: 'F', sourceKind: 'rss'}],
      windowStart: '2026-07-26T11:00:00.000Z',
      windowEnd: '2026-07-27T11:00:00.000Z',
      count: 1,
    });

    const result = await fetchDigestSourceItems({hours: 24});

    expect(result.count).toBe(1);
    expect(result.items[0]!.sourceKind).toBe('rss');
  });

  it('should send the bearer token', async () => {
    const captured = captureFetch({items: [], windowStart: 'a', windowEnd: 'b', count: 0});

    await fetchDigestSourceItems();

    const headers = captured.init.headers as Record<string, string>;
    expect(headers['Authorization']).toBe(`Bearer ${TEST_API_KEY}`);
  });

  it('should throw on a non-ok response', async () => {
    captureFetch({error: 'Unauthorized'}, 401);

    expect(async () => {
      await fetchDigestSourceItems();
    }).toThrow();
  });
});

describe('fetchDailySummary', () => {
  it('should request the latest when no date is given', async () => {
    const captured = captureFetch({summaryDate: '2026-07-27', topics: []});

    await fetchDailySummary();

    expect(captured.url).toBe(`${TEST_API_URL}/api/digest/daily-summary`);
  });

  it('should pass a date through as a query param', async () => {
    const captured = captureFetch({summaryDate: '2026-07-25', topics: []});

    await fetchDailySummary({date: '2026-07-25'});

    expect(captured.url).toBe(`${TEST_API_URL}/api/digest/daily-summary?date=2026-07-25`);
  });

  it('should return the parsed summary', async () => {
    captureFetch({summaryDate: '2026-07-27', topics: [topic], itemCount: 2, notable: 'x'});

    const result = await fetchDailySummary();

    expect(result.topics[0]!.title).toBe('Model releases');
  });

  it('should throw on a 404', async () => {
    captureFetch({error: 'Daily summary not found'}, 404);

    expect(async () => {
      await fetchDailySummary({date: '2026-01-01'});
    }).toThrow();
  });
});

describe('fetchDailySummaryDates', () => {
  it('should request the dates endpoint', async () => {
    const captured = captureFetch({dates: []});

    await fetchDailySummaryDates();

    expect(captured.url).toBe(`${TEST_API_URL}/api/digest/daily-summary/dates`);
  });

  it('should return the parsed dates', async () => {
    captureFetch({dates: ['2026-07-27', '2026-07-26']});

    const result = await fetchDailySummaryDates();

    expect(result.dates).toEqual(['2026-07-27', '2026-07-26']);
  });
});

describe('upsertDailySummary', () => {
  it('should post the payload to the digest endpoint', async () => {
    const captured = captureFetch({summaryDate: '2026-07-27', topics: [topic]}, 201);

    await upsertDailySummary({topics: [topic], notable: 'Model releases dominated.'});

    expect(captured.url).toBe(`${TEST_API_URL}/api/digest/daily-summary`);
    expect(captured.init.method).toBe('POST');
    expect(JSON.parse(captured.init.body as string)).toEqual({
      topics: [topic],
      notable: 'Model releases dominated.',
    });
  });

  it('should post an empty topics array unchanged', async () => {
    const captured = captureFetch({summaryDate: '2026-07-27', topics: []}, 201);

    await upsertDailySummary({topics: []});

    expect(JSON.parse(captured.init.body as string)).toEqual({topics: []});
  });

  it('should throw on a validation error', async () => {
    captureFetch({error: 'Invalid request body'}, 400);

    expect(async () => {
      await upsertDailySummary({topics: []});
    }).toThrow();
  });
});
