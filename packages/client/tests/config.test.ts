import {describe, it, expect, beforeEach, afterAll} from 'bun:test';
import {mock} from 'bun:test';
import {init, apiFetch, reset} from '../src/config';

describe('apiFetch', () => {
  const originalFetch = global.fetch;

  afterAll(function () {
    global.fetch = originalFetch;
  });

  beforeEach(function () {
    reset();
    global.fetch = originalFetch;
  });

  it('should throw when client is not initialized', async () => {
    try {
      await apiFetch('/test');
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error instanceof Error).toBe(true);
      expect((error as Error).message).toBe('client not initialized — call init() first');
    }
  });

  it('should include Authorization header when apiKey is set', async () => {
    init({apiUrl: 'http://localhost:3001', apiKey: 'test-key-123'});

    let capturedHeaders: Record<string, string> = {};

    global.fetch = mock(async (url, options) => {
      capturedHeaders = (options as RequestInit).headers as Record<string, string>;
      return {
        ok: true,
        json: async () => ({message: 'success'}),
      } as unknown as Response;
    });

    await apiFetch('/api/test');

    expect(capturedHeaders['Authorization']).toBe('Bearer test-key-123');
  });

  it('should omit Authorization header when apiKey is not set', async () => {
    init({apiUrl: 'http://localhost:3001'});

    let capturedHeaders: Record<string, string> = {};

    global.fetch = mock(async (url, options) => {
      capturedHeaders = (options as RequestInit).headers as Record<string, string>;
      return {
        ok: true,
        json: async () => ({message: 'success'}),
      } as unknown as Response;
    });

    await apiFetch('/api/test');

    expect(capturedHeaders['Authorization']).toBeUndefined();
  });

  it('should set Content-Type to application/json', async () => {
    init({apiUrl: 'http://localhost:3001'});

    let capturedHeaders: Record<string, string> = {};

    global.fetch = mock(async (url, options) => {
      capturedHeaders = (options as RequestInit).headers as Record<string, string>;
      return {
        ok: true,
        json: async () => ({message: 'success'}),
      } as unknown as Response;
    });

    await apiFetch('/api/test');

    expect(capturedHeaders['Content-Type']).toBe('application/json');
  });

  it('should merge custom headers', async () => {
    init({apiUrl: 'http://localhost:3001', apiKey: 'test-key'});

    let capturedHeaders: Record<string, string> = {};

    global.fetch = mock(async (url, options) => {
      capturedHeaders = (options as RequestInit).headers as Record<string, string>;
      return {
        ok: true,
        json: async () => ({message: 'success'}),
      } as unknown as Response;
    });

    await apiFetch('/api/test', {
      headers: {'X-Custom-Header': 'custom-value'},
    });

    expect(capturedHeaders['X-Custom-Header']).toBe('custom-value');
    expect(capturedHeaders['Content-Type']).toBe('application/json');
    expect(capturedHeaders['Authorization']).toBe('Bearer test-key');
  });

  it('should return parsed JSON on success', async () => {
    init({apiUrl: 'http://localhost:3001'});

    const expectedData = {id: 1, name: 'test', value: 42};

    global.fetch = mock(
      async () =>
        ({
          ok: true,
          json: async () => expectedData,
        }) as unknown as Response,
    );

    const result = await apiFetch('/api/test');

    expect(result).toEqual(expectedData);
  });

  it('should throw formatted error on non-ok response', async () => {
    init({apiUrl: 'http://localhost:3001'});

    global.fetch = mock(
      async () =>
        ({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          text: async () => 'Resource not found',
        }) as unknown as Response,
    );

    try {
      await apiFetch('/api/test');
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error instanceof Error).toBe(true);
      expect((error as Error).message).toBe('API error: 404 Not Found — Resource not found');
    }
  });

  it('should handle unreadable error body gracefully', async () => {
    init({apiUrl: 'http://localhost:3001'});

    global.fetch = mock(
      async () =>
        ({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: async () => {
            throw new Error('Failed to read body');
          },
        }) as unknown as Response,
    );

    try {
      await apiFetch('/api/test');
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error instanceof Error).toBe(true);
      expect((error as Error).message).toBe('API error: 500 Internal Server Error — ');
    }
  });
});
