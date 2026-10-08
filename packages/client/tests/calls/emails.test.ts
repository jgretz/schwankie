import {describe, it, expect, beforeEach, afterEach} from 'bun:test';
import {init, reset} from '../../src/config';
import {markEmailItemOpened} from '../../src/calls/mark-email-item-opened';

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

describe('Email Client Calls', () => {
  describe('markEmailItemOpened', () => {
    it('should post to the open endpoint for the item', async () => {
      let requested = '';
      global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        requested = `${init?.method} ${String(input)}`;
        return new Response(JSON.stringify({opened: true}), {
          status: 200,
          headers: {'Content-Type': 'application/json'},
        });
      }) as any;

      await markEmailItemOpened('email-1');

      expect(requested).toBe(`POST ${TEST_API_URL}/api/emails/email-1/open`);
    });

    it('should return the confirmation on success', async () => {
      global.fetch = (async () =>
        new Response(JSON.stringify({opened: true}), {
          status: 200,
          headers: {'Content-Type': 'application/json'},
        })) as any;

      const result = await markEmailItemOpened('email-1');

      expect(result.opened).toBe(true);
    });

    it('should throw on item not found', async () => {
      global.fetch = (async () =>
        new Response(JSON.stringify({error: 'Email item not found'}), {
          status: 404,
          headers: {'Content-Type': 'application/json'},
        })) as any;

      expect(async () => {
        await markEmailItemOpened('nonexistent');
      }).toThrow();
    });
  });
});
