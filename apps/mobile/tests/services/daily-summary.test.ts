import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'bun:test';
import {init} from 'client';
import {makeDailySummary} from '../factories';
import {fetchDailySummaryOrNull} from '../../src/services/daily-summary';

// The mapping under test is a contract with the message `apiFetch` builds, so
// these drive the real client and stub `fetch` rather than mocking the call.
// `client` exports no `reset`, so the config set here outlives the file; no
// other mobile test reaches the network.
const originalFetch = global.fetch;

function respond(status: number, statusText: string, body: unknown): void {
  global.fetch = (async () =>
    new Response(JSON.stringify(body), {status, statusText})) as unknown as typeof fetch;
}

beforeAll(function () {
  init({apiUrl: 'https://api.test.local', apiKey: 'test-key'});
});

beforeEach(function () {
  global.fetch = originalFetch;
});

afterAll(function () {
  global.fetch = originalFetch;
});

describe('fetchDailySummaryOrNull', function () {
  it('should return the digest for a day the job has covered', async function () {
    const summary = makeDailySummary({summaryDate: '2026-03-01'});
    respond(200, 'OK', summary);

    expect(await fetchDailySummaryOrNull('2026-03-01')).toEqual(summary);
  });

  it('should return null for the 404 the API answers for an uncovered day', async function () {
    respond(404, 'Not Found', {error: 'Daily summary not found'});

    expect(await fetchDailySummaryOrNull('2026-03-01')).toBeNull();
  });

  it('should rethrow a server error whose body happens to mention 404', async function () {
    respond(500, 'Internal Server Error', {error: 'upstream gave 404'});

    await expect(fetchDailySummaryOrNull('2026-03-01')).rejects.toThrow('API error: 500');
  });
});
