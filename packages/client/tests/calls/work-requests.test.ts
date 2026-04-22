import {describe, it, expect, beforeEach, afterEach} from 'bun:test';
import {init, reset} from '../../src/config';
import {startWorkRequest} from '../../src/calls/start-work-request';

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

describe('Work Request Client Calls', () => {
  describe('startWorkRequest', () => {
    it('should start work request on success', async () => {
      const mockWorkRequest = {
        id: 'wr-1',
        type: 'refresh-all-feeds',
        status: 'processing',
        createdAt: '2026-04-22T00:00:00Z',
      };
      global.fetch = (async () =>
        new Response(JSON.stringify(mockWorkRequest), {status: 200, headers: {'Content-Type': 'application/json'}})) as any;

      const result = await startWorkRequest('wr-1');
      expect(result?.id).toBe('wr-1');
      expect(result?.status).toBe('processing');
    });

    it('should return null on 409 conflict (race condition)', async () => {
      global.fetch = (async () =>
        new Response(JSON.stringify({error: 'Conflict'}), {status: 409, headers: {'Content-Type': 'application/json'}})) as any;

      const result = await startWorkRequest('wr-1');
      expect(result).toBeNull();
    });

    it('should throw on non-409 HTTP error', async () => {
      global.fetch = (async () =>
        new Response(JSON.stringify({error: 'Not found'}), {status: 404, headers: {'Content-Type': 'application/json'}})) as any;

      expect(async () => {
        await startWorkRequest('nonexistent');
      }).toThrow();
    });

    it('should throw on network error', async () => {
      global.fetch = (async () => {
        throw new Error('Network failed');
      }) as any;

      expect(async () => {
        await startWorkRequest('wr-1');
      }).toThrow();
    });
  });
});
