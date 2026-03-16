import {afterAll, beforeEach, describe, expect, it, mock} from 'bun:test';
import type {LinkMetadata} from '../src/index.ts';

const originalFetch = global.fetch;

afterAll(function () {
  global.fetch = originalFetch;
});

beforeEach(function () {
  global.fetch = originalFetch;
});

function mockFetchWith(html: string) {
  global.fetch = mock(
    async () =>
      ({
        ok: true,
        text: async () => html,
      }) as unknown as Response,
  ) as unknown as typeof fetch;
}

// dynamic import after mocks are set up per-test
async function callExtract(url: string): Promise<LinkMetadata> {
  const mod = await import('../src/index.ts');
  return mod.extractMetadata(url);
}

describe('extractMetadata', function () {
  it('should extract title, description, and image from og meta tags', async function () {
    const html = `
      <html>
        <head>
          <meta property="og:title" content="Test Page" />
          <meta property="og:description" content="A test description" />
          <meta property="og:image" content="https://example.com/image.png" />
        </head>
        <body></body>
      </html>
    `;
    mockFetchWith(html);

    const result = await callExtract('https://example.com');

    expect(result.title).toBe('Test Page');
    expect(result.description).toBe('A test description');
    expect(result.imageUrl).toBe('https://example.com/image.png');
    expect(result.url).toBe('https://example.com');
    expect(result.tags).toEqual([]);
  });

  it('should populate tags from author meta', async function () {
    const html = `
      <html>
        <head>
          <meta property="og:title" content="Author Post" />
          <meta name="author" content="Jane Doe" />
        </head>
        <body></body>
      </html>
    `;
    mockFetchWith(html);

    const result = await callExtract('https://example.com/post');

    expect(result.tags).toEqual(['Jane Doe']);
  });

  it('should return fallback when fetch fails', async function () {
    global.fetch = mock(async () => {
      throw new Error('Network error');
    }) as unknown as typeof fetch;

    const result = await callExtract('https://unreachable.example.com');

    expect(result.url).toBe('https://unreachable.example.com');
    expect(result.title).toBe('https://unreachable.example.com');
    expect(result.description).toBeNull();
    expect(result.imageUrl).toBeNull();
    expect(result.tags).toEqual([]);
  });
});
