import {afterEach, beforeAll, beforeEach, describe, expect, it, mock} from 'bun:test';

const SESSION_SECRET = 'a'.repeat(32);
const originalFetch = global.fetch;
const cookies: Record<string, string> = {};

// Unwrap createServerFn into the plain handler. Supports both the
// `.inputValidator().handler()` and bare `.handler()` shapes.
mock.module('@tanstack/react-start', () => ({
  createServerFn: () => ({
    inputValidator: () => ({
      handler: (fn: (...args: unknown[]) => unknown) => fn,
    }),
    handler: (fn: (...args: unknown[]) => unknown) => fn,
  }),
}));

mock.module('@tanstack/react-start/server', () => ({
  getCookie: (name: string) => cookies[name] ?? undefined,
  setCookie: (name: string, value: string) => {
    cookies[name] = value;
  },
}));

mock.module('../../src/lib/env.server', () => ({
  getEnv: () => ({
    ALLOWED_EMAIL: 'admin@example.com',
    GOOGLE_CLIENT_ID: 'test-client-id',
    GOOGLE_CLIENT_SECRET: 'test-secret',
    GOOGLE_CALLBACK_URL: 'http://localhost:3000/auth/callback',
    SESSION_SECRET,
    API_KEY: 'test-api-key',
  }),
}));

mock.module('../../src/lib/init-client.server', () => ({
  initClientServer: mock(() => {}),
}));

type Summary = {summaryDate: string; topics: unknown[]} | null;

let getDailySummaryAction: (input: {data: {date?: string}}) => Promise<Summary>;
let listDailySummaryDatesAction: () => Promise<{dates: string[]}>;
let markDailySummaryItemsReadAction: (input: {
  data: {date: string};
}) => Promise<{rssCount: number; emailCount: number; count: number}>;
let createSession: (email: string) => Promise<void>;

beforeAll(async function () {
  const {init} = await import('client');
  init({apiUrl: 'http://localhost:3001', apiKey: 'test-key'});

  const mod = await import('../../src/lib/daily-summary-actions');
  getDailySummaryAction = mod.getDailySummaryAction as typeof getDailySummaryAction;
  listDailySummaryDatesAction =
    mod.listDailySummaryDatesAction as typeof listDailySummaryDatesAction;
  markDailySummaryItemsReadAction =
    mod.markDailySummaryItemsReadAction as typeof markDailySummaryItemsReadAction;

  const sessionMod = await import('../../src/lib/session.server');
  createSession = sessionMod.createSession;
});

afterEach(function () {
  global.fetch = originalFetch;
});

beforeEach(async function () {
  global.fetch = originalFetch;
  for (const key of Object.keys(cookies)) {
    delete cookies[key];
  }
  await createSession('admin@example.com');
  const {init} = await import('client');
  init({apiUrl: 'http://localhost:3001', apiKey: 'test-key'});
});

function respondWith(body: unknown, ok = true, status = 200): void {
  global.fetch = mock(
    async () =>
      ({
        ok,
        status,
        statusText: ok ? 'OK' : 'Not Found',
        json: async () => body,
        text: async () => JSON.stringify(body),
      }) as unknown as Response,
  ) as unknown as typeof fetch;
}

describe('getDailySummaryAction', function () {
  it('should return the summary for a date', async function () {
    respondWith({summaryDate: '2026-07-27', topics: []});

    const result = await getDailySummaryAction({data: {date: '2026-07-27'}});

    expect(result?.summaryDate).toBe('2026-07-27');
  });

  it('should return null when the day has no digest', async function () {
    respondWith({error: 'Daily summary not found'}, false, 404);

    const result = await getDailySummaryAction({data: {}});

    expect(result).toBeNull();
  });

  it('should rethrow a non-404 failure', async function () {
    respondWith({error: 'Unauthorized'}, false, 401);

    expect(async () => {
      await getDailySummaryAction({data: {}});
    }).toThrow();
  });

  it('should throw when not authenticated', async function () {
    for (const key of Object.keys(cookies)) {
      delete cookies[key];
    }

    try {
      await getDailySummaryAction({data: {}});
      expect.unreachable('should have thrown');
    } catch (error) {
      expect((error as Error).message).toBe('Unauthorized');
    }
  });
});

describe('listDailySummaryDatesAction', function () {
  it('should return the dates', async function () {
    respondWith({dates: ['2026-07-27', '2026-07-26']});

    const result = await listDailySummaryDatesAction();

    expect(result.dates).toEqual(['2026-07-27', '2026-07-26']);
  });

  it('should throw when not authenticated', async function () {
    for (const key of Object.keys(cookies)) {
      delete cookies[key];
    }

    try {
      await listDailySummaryDatesAction();
      expect.unreachable('should have thrown');
    } catch (error) {
      expect((error as Error).message).toBe('Unauthorized');
    }
  });
});

describe('markDailySummaryItemsReadAction', function () {
  it('should forward the date to the API', async function () {
    respondWith({rssCount: 0, emailCount: 0, count: 0});

    await markDailySummaryItemsReadAction({data: {date: '2026-07-27'}});

    const [url, requestInit] = (global.fetch as unknown as ReturnType<typeof mock>).mock
      .calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:3001/api/digest/daily-summary/mark-read');
    expect(requestInit.method).toBe('POST');
    expect(JSON.parse(requestInit.body as string)).toEqual({date: '2026-07-27'});
  });

  it('should return the counts', async function () {
    const counts = {rssCount: 2, emailCount: 1, count: 3};
    respondWith(counts);

    const result = await markDailySummaryItemsReadAction({data: {date: '2026-07-27'}});

    expect(result).toEqual(counts);
  });

  it('should reject on a non-ok response', async function () {
    respondWith({error: 'Daily summary not found'}, false, 404);

    await expect(markDailySummaryItemsReadAction({data: {date: '2026-01-01'}})).rejects.toThrow(
      'API error: 404',
    );
  });

  it('should throw and skip the API when not authenticated', async function () {
    respondWith({rssCount: 0, emailCount: 0, count: 0});
    for (const key of Object.keys(cookies)) {
      delete cookies[key];
    }

    await expect(markDailySummaryItemsReadAction({data: {date: '2026-07-27'}})).rejects.toThrow(
      'Unauthorized',
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
