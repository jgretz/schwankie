import {describe, it, expect, beforeEach, afterEach} from 'bun:test';
import {init, reset} from '../../src/config';
import {startWorkRequest} from '../../src/calls/start-work-request';
import {listPendingWorkRequests} from '../../src/calls/list-pending-work-requests';
import {completeWorkRequest} from '../../src/calls/complete-work-request';
import {failWorkRequest} from '../../src/calls/fail-work-request';
import {triggerRefreshAllFeeds} from '../../src/calls/trigger-refresh-all-feeds';
import {triggerRefreshEmails} from '../../src/calls/trigger-refresh-emails';

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

  describe('listPendingWorkRequests', () => {
    it('should list pending work requests', async () => {
      const mockList = [
        {id: 'wr-1', type: 'refresh-all-feeds', status: 'pending', createdAt: '2026-04-22T00:00:00Z'},
        {id: 'wr-2', type: 'refresh-emails', status: 'pending', createdAt: '2026-04-22T00:01:00Z'},
      ];
      global.fetch = (async () =>
        new Response(JSON.stringify(mockList), {status: 200, headers: {'Content-Type': 'application/json'}})) as any;

      const result = await listPendingWorkRequests();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0]?.id).toBe('wr-1');
    });

    it('should return empty array when no pending work requests', async () => {
      global.fetch = (async () =>
        new Response(JSON.stringify([]), {status: 200, headers: {'Content-Type': 'application/json'}})) as any;

      const result = await listPendingWorkRequests();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should throw on HTTP error', async () => {
      global.fetch = (async () =>
        new Response(JSON.stringify({error: 'Server error'}), {status: 500, headers: {'Content-Type': 'application/json'}})) as any;

      expect(async () => {
        await listPendingWorkRequests();
      }).toThrow();
    });
  });

  describe('completeWorkRequest', () => {
    it('should complete work request', async () => {
      const mockCompleted = {
        id: 'wr-1',
        type: 'refresh-all-feeds',
        status: 'completed',
        completedAt: '2026-04-22T00:05:00Z',
        createdAt: '2026-04-22T00:00:00Z',
      };
      global.fetch = (async () =>
        new Response(JSON.stringify(mockCompleted), {status: 200, headers: {'Content-Type': 'application/json'}})) as any;

      const result = await completeWorkRequest('wr-1');
      expect(result.id).toBe('wr-1');
      expect(result.status).toBe('completed');
      expect(result.completedAt).toBeTruthy();
    });

    it('should throw on error', async () => {
      global.fetch = (async () =>
        new Response(JSON.stringify({error: 'Not found'}), {status: 404, headers: {'Content-Type': 'application/json'}})) as any;

      expect(async () => {
        await completeWorkRequest('nonexistent');
      }).toThrow();
    });
  });

  describe('failWorkRequest', () => {
    it('should fail work request with error message', async () => {
      const mockFailed = {
        id: 'wr-1',
        type: 'refresh-all-feeds',
        status: 'failed',
        errorMessage: 'Timeout error',
        completedAt: '2026-04-22T00:05:00Z',
        createdAt: '2026-04-22T00:00:00Z',
      };
      global.fetch = (async () =>
        new Response(JSON.stringify(mockFailed), {status: 200, headers: {'Content-Type': 'application/json'}})) as any;

      const result = await failWorkRequest('wr-1', 'Timeout error');
      expect(result.id).toBe('wr-1');
      expect(result.status).toBe('failed');
      expect(result.errorMessage).toBe('Timeout error');
    });

    it('should throw on error', async () => {
      global.fetch = (async () =>
        new Response(JSON.stringify({error: 'Not found'}), {status: 404, headers: {'Content-Type': 'application/json'}})) as any;

      expect(async () => {
        await failWorkRequest('nonexistent', 'Error');
      }).toThrow();
    });
  });

  describe('triggerRefreshAllFeeds', () => {
    it('should trigger feeds refresh and return work request id', async () => {
      const mockResponse = {id: 'wr-123'};
      global.fetch = (async () =>
        new Response(JSON.stringify(mockResponse), {status: 201, headers: {'Content-Type': 'application/json'}})) as any;

      const result = await triggerRefreshAllFeeds();
      expect(result.id).toBe('wr-123');
    });

    it('should throw on error', async () => {
      global.fetch = (async () =>
        new Response(JSON.stringify({error: 'Unauthorized'}), {status: 401, headers: {'Content-Type': 'application/json'}})) as any;

      expect(async () => {
        await triggerRefreshAllFeeds();
      }).toThrow();
    });
  });

  describe('triggerRefreshEmails', () => {
    it('should trigger emails refresh and return work request id', async () => {
      const mockResponse = {id: 'wr-456'};
      global.fetch = (async () =>
        new Response(JSON.stringify(mockResponse), {status: 201, headers: {'Content-Type': 'application/json'}})) as any;

      const result = await triggerRefreshEmails();
      expect(result.id).toBe('wr-456');
    });

    it('should throw on error', async () => {
      global.fetch = (async () =>
        new Response(JSON.stringify({error: 'Unauthorized'}), {status: 401, headers: {'Content-Type': 'application/json'}})) as any;

      expect(async () => {
        await triggerRefreshEmails();
      }).toThrow();
    });
  });
});
