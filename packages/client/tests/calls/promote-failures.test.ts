import {describe, it, expect, beforeEach, afterEach} from 'bun:test';
import {init, reset} from '../../src/config';
import {listPromoteFailures} from '../../src/calls/list-promote-failures';

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

const emptyPage = {items: [], total: 0, hasMore: false, nextOffset: 0};

describe('listPromoteFailures', () => {
  it('should request the bare endpoint when no params are given', async () => {
    const captured = captureFetch(emptyPage);

    await listPromoteFailures();

    expect(captured.url).toBe(`${TEST_API_URL}/api/promote-failures`);
  });

  it('should build the query string from limit, offset and source', async () => {
    const captured = captureFetch(emptyPage);

    await listPromoteFailures({limit: 10, offset: 20, source: 'rss'});

    expect(captured.url).toBe(`${TEST_API_URL}/api/promote-failures?limit=10&offset=20&source=rss`);
  });

  it('should send offset=0 rather than dropping it', async () => {
    const captured = captureFetch(emptyPage);

    await listPromoteFailures({offset: 0});

    expect(captured.url).toBe(`${TEST_API_URL}/api/promote-failures?offset=0`);
  });

  it('should return the parsed page', async () => {
    captureFetch({
      items: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          source: 'rss',
          sourceItemId: 'item-1',
          url: 'https://example.com/a',
          title: 'A',
          errorMessage: 'url exceeds the maximum of 2048 characters',
          errorCode: 'DOMAIN_VALIDATION',
          createdAt: '2026-07-27T11:00:00.000Z',
        },
      ],
      total: 1,
      hasMore: false,
      nextOffset: 1,
    });

    const result = await listPromoteFailures({source: 'rss'});

    expect(result.total).toBe(1);
    expect(result.items[0]!.errorCode).toBe('DOMAIN_VALIDATION');
  });

  it('should send the bearer token', async () => {
    const captured = captureFetch(emptyPage);

    await listPromoteFailures();

    const headers = captured.init.headers as Record<string, string>;
    expect(headers['Authorization']).toBe(`Bearer ${TEST_API_KEY}`);
  });

  it('should throw on a non-ok response', async () => {
    captureFetch({error: 'Unauthorized'}, 401);

    expect(async () => {
      await listPromoteFailures();
    }).toThrow();
  });
});
