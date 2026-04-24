import {describe, it, expect, beforeEach, afterEach} from 'bun:test';
import {init, reset} from '../../src/config';
import {getRelatedLinks} from '../../src/calls/get-related-links';
import {listPendingEmbeddings} from '../../src/calls/list-pending-embeddings';
import {listQueueSimilarityScores} from '../../src/calls/list-queue-similarity-scores';
import {upsertLinkEmbedding} from '../../src/calls/upsert-link-embedding';

const TEST_API_URL = 'http://localhost:3001';
const TEST_API_KEY = 'test-key';

const originalFetch = global.fetch as typeof global.fetch;

beforeEach(function () {
  init({apiUrl: TEST_API_URL, apiKey: TEST_API_KEY});
  global.fetch = originalFetch;
});

afterEach(function () {
  reset();
  global.fetch = originalFetch;
});

describe('getRelatedLinks', function () {
  it('hits /api/links/:id/related and returns items', async function () {
    let captured = '';
    global.fetch = (async (url: string) => {
      captured = url;
      return new Response(JSON.stringify({items: [{id: 7, title: 'A'}]}), {
        status: 200,
        headers: {'Content-Type': 'application/json'},
      });
    }) as unknown as typeof fetch;

    const result = await getRelatedLinks(42, 5);

    expect(result.items).toHaveLength(1);
    expect(captured).toBe(`${TEST_API_URL}/api/links/42/related?limit=5`);
  });

  it('throws on HTTP error', async function () {
    global.fetch = (async () =>
      new Response('nope', {status: 500})) as unknown as typeof fetch;

    expect(async function () {
      await getRelatedLinks(42);
    }).toThrow();
  });
});

describe('listPendingEmbeddings', function () {
  it('encodes model and limit as query params', async function () {
    let captured = '';
    global.fetch = (async (url: string) => {
      captured = url;
      return new Response(JSON.stringify({items: []}), {
        status: 200,
        headers: {'Content-Type': 'application/json'},
      });
    }) as unknown as typeof fetch;

    await listPendingEmbeddings('nomic-embed-text', 25);

    expect(captured).toContain('model=nomic-embed-text');
    expect(captured).toContain('limit=25');
  });
});

describe('upsertLinkEmbedding', function () {
  it('PUTs the embedding and model to the link id', async function () {
    let method = '';
    let body = '';
    global.fetch = (async (_url: string, init: RequestInit) => {
      method = init.method ?? '';
      body = init.body as string;
      return new Response(JSON.stringify({upserted: true}), {
        status: 200,
        headers: {'Content-Type': 'application/json'},
      });
    }) as unknown as typeof fetch;

    const result = await upsertLinkEmbedding(7, {
      embedding: [0.1, 0.2],
      model: 'nomic-embed-text',
    });

    expect(result.upserted).toBe(true);
    expect(method).toBe('PUT');
    expect(JSON.parse(body)).toEqual({
      embedding: [0.1, 0.2],
      model: 'nomic-embed-text',
    });
  });
});

describe('listQueueSimilarityScores', function () {
  it('passes limit, k, and minSimilarity as params', async function () {
    let captured = '';
    global.fetch = (async (url: string) => {
      captured = url;
      return new Response(JSON.stringify({items: []}), {
        status: 200,
        headers: {'Content-Type': 'application/json'},
      });
    }) as unknown as typeof fetch;

    await listQueueSimilarityScores(50, 5, 0.7);

    expect(captured).toContain('limit=50');
    expect(captured).toContain('k=5');
    expect(captured).toContain('minSimilarity=0.7');
  });
});
