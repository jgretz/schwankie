import {describe, it, expect, beforeEach, afterEach} from 'bun:test';
import {init, reset} from '../../src/config';
import {searchHistory} from '../../src/calls/search-history';

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

const response = {
  results: [
    {
      kind: 'rss',
      feedId: 'feed-1',
      id: 'item-1',
      title: 'At 19, Ghost founder raises $11 million',
      url: 'https://example.com/ghost',
      source: 'TechCrunch',
      ingestedAt: '2026-10-05T09:00:00.000Z',
      openedAt: null,
      promoted: false,
      reason: 'A startup building hardware for local AI',
    },
  ],
  judged: true,
  windowStart: '2026-09-08T12:00:00.000Z',
};

describe('searchHistory', () => {
  it('should encode the description and pass the window', async () => {
    const captured = captureFetch(response);

    await searchHistory({q: 'local llm & startup', days: 90});

    const url = new URL(captured.url);
    expect(`${url.origin}${url.pathname}`).toBe(`${TEST_API_URL}/api/history/search`);
    expect(url.search).toBe('?q=local+llm+%26+startup&days=90');
    expect(url.searchParams.get('q')).toBe('local llm & startup');
  });

  it('should leave the window to the api default when omitted', async () => {
    const captured = captureFetch(response);

    await searchHistory({q: 'local llm'});

    expect(new URL(captured.url).searchParams.has('days')).toBe(false);
  });

  it('should send the bearer token', async () => {
    const captured = captureFetch(response);

    await searchHistory({q: 'local llm', days: 30});

    const headers = captured.init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Bearer ${TEST_API_KEY}`);
  });

  it('should return the parsed results', async () => {
    captureFetch(response);

    const result = await searchHistory({q: 'local llm', days: 30});

    expect(result).toEqual(response as any);
  });

  it('should reject on a non-ok response', async () => {
    captureFetch({error: 'Unauthorized'}, 401);

    await expect(searchHistory({q: 'local llm', days: 30})).rejects.toThrow('API error: 401');
  });
});
