import {describe, it, expect, beforeEach, afterEach} from 'bun:test';
import {init, reset} from '../../src/config';
import {deleteLinks} from '../../src/calls/delete-links';

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

describe('Links Client Calls', () => {
  describe('deleteLinks', () => {
    it('should return deleted count on success', async () => {
      let capturedUrl = '';
      let capturedBody = '';
      global.fetch = (async (url: string, init: RequestInit) => {
        capturedUrl = url;
        capturedBody = init.body as string;
        return new Response(JSON.stringify({deleted: 3}), {
          status: 200,
          headers: {'Content-Type': 'application/json'},
        });
      }) as any;

      const result = await deleteLinks([1, 2, 3]);

      expect(result.deleted).toBe(3);
      expect(capturedUrl).toBe(`${TEST_API_URL}/api/links/bulk-delete`);
      expect(JSON.parse(capturedBody)).toEqual({ids: [1, 2, 3]});
    });

    it('should throw on HTTP error response', async () => {
      global.fetch = (async () =>
        new Response(JSON.stringify({error: 'Unauthorized'}), {
          status: 401,
          headers: {'Content-Type': 'application/json'},
        })) as any;

      expect(async () => {
        await deleteLinks([1]);
      }).toThrow();
    });

    it('should throw on network error', async () => {
      global.fetch = (async () => {
        throw new Error('Network failed');
      }) as any;

      expect(async () => {
        await deleteLinks([1]);
      }).toThrow();
    });
  });
});
