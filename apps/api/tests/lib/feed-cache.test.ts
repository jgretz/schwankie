import {mock, describe, it, expect, beforeEach} from 'bun:test';
import type {LinkWithTags} from '@domain';
import {
  createFeedHandler,
  evaluateConditional,
  resetFeedCache,
} from '../../src/lib/feed-cache';

beforeEach(function () {
  resetFeedCache();
});

function makeContext(headers: Record<string, string> = {}): {
  req: {header: (name: string) => string | undefined};
} {
  const lowered: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) lowered[k.toLowerCase()] = v;
  return {req: {header: (name: string) => lowered[name.toLowerCase()]}};
}

describe('evaluateConditional', function () {
  it('should signal not modified when If-None-Match matches the etag', function () {
    const version = '2026-04-27T10:00:00.000Z';
    const result = evaluateConditional('rss', version, `W/"rss-${version}"`, null);
    expect(result.notModified).toBe(true);
  });

  it('should not match across formats with the same version', function () {
    const version = '2026-04-27T10:00:00.000Z';
    const result = evaluateConditional('atom', version, `W/"rss-${version}"`, null);
    expect(result.notModified).toBe(false);
  });

  it('should signal not modified when If-Modified-Since is at or after the version', function () {
    const version = '2026-04-01T00:00:00.000Z';
    const ifModifiedSince = new Date('2026-04-01T00:00:00.000Z').toUTCString();
    const result = evaluateConditional('rss', version, null, ifModifiedSince);
    expect(result.notModified).toBe(true);
  });

  it('should not signal not modified when If-Modified-Since is before the version', function () {
    const version = '2026-04-10T00:00:00.000Z';
    const ifModifiedSince = new Date('2026-04-01T00:00:00.000Z').toUTCString();
    const result = evaluateConditional('rss', version, null, ifModifiedSince);
    expect(result.notModified).toBe(false);
  });

  it('should not signal not modified when version is null and If-Modified-Since is provided', function () {
    const result = evaluateConditional('rss', null, null, new Date().toUTCString());
    expect(result.notModified).toBe(false);
  });

  it('should produce a stable etag of W/"<format>-<version>"', function () {
    const version = '2026-04-27T10:00:00.000Z';
    const result = evaluateConditional('atom', version, null, null);
    expect(result.etag).toBe(`W/"atom-${version}"`);
  });

  it('should produce a W/"<format>-empty" etag when version is null', function () {
    const result = evaluateConditional('rss', null, null, null);
    expect(result.etag).toBe('W/"rss-empty"');
  });
});

describe('createFeedHandler', function () {
  it('should call fetchItems and render once on cold cache, then serve cached on second call', async function () {
    const fetchItems = mock(async () => [] as LinkWithTags[]);
    const getVersion = mock(() => '2026-04-27T10:00:00.000Z');
    let renderCount = 0;

    const handler = createFeedHandler({
      format: 'rss',
      contentType: 'application/rss+xml',
      render: () => {
        renderCount += 1;
        return '<rss/>';
      },
      fetchItems,
      getVersion,
    });

    const first = await handler(makeContext() as never);
    expect(first.status).toBe(200);
    expect(await first.text()).toBe('<rss/>');
    expect(renderCount).toBe(1);
    expect(fetchItems).toHaveBeenCalledTimes(1);

    const second = await handler(makeContext() as never);
    expect(second.status).toBe(200);
    expect(await second.text()).toBe('<rss/>');
    expect(renderCount).toBe(1);
    expect(fetchItems).toHaveBeenCalledTimes(1);
  });

  it('should re-render when the links version changes', async function () {
    const fetchItems = mock(async () => [] as LinkWithTags[]);
    let renderCount = 0;
    const versions = ['2026-04-27T10:00:00.000Z', '2026-04-27T11:00:00.000Z'];
    let versionIdx = 0;

    const handler = createFeedHandler({
      format: 'rss',
      contentType: 'application/rss+xml',
      render: () => {
        renderCount += 1;
        return `<rss>${renderCount}</rss>`;
      },
      fetchItems,
      getVersion: () => versions[Math.min(versionIdx, versions.length - 1)]!,
    });

    await handler(makeContext() as never);
    expect(renderCount).toBe(1);

    versionIdx = 1;
    const after = await handler(makeContext() as never);
    expect(renderCount).toBe(2);
    expect(await after.text()).toBe('<rss>2</rss>');
  });

  it('should return 304 with empty body when If-None-Match matches', async function () {
    const fetchItems = mock(async () => [] as LinkWithTags[]);
    const handler = createFeedHandler({
      format: 'rss',
      contentType: 'application/rss+xml',
      render: () => '<rss/>',
      fetchItems,
      getVersion: () => '2026-04-27T10:00:00.000Z',
    });

    const res = await handler(
      makeContext({'If-None-Match': 'W/"rss-2026-04-27T10:00:00.000Z"'}) as never,
    );

    expect(res.status).toBe(304);
    expect(await res.text()).toBe('');
    expect(res.headers.get('etag')).toBe('W/"rss-2026-04-27T10:00:00.000Z"');
    expect(fetchItems).not.toHaveBeenCalled();
  });

  it('should set Content-Type, ETag, Cache-Control, and Last-Modified on 200 responses', async function () {
    const handler = createFeedHandler({
      format: 'atom',
      contentType: 'application/atom+xml; charset=utf-8',
      render: () => '<feed/>',
      fetchItems: async () => [] as LinkWithTags[],
      getVersion: () => '2026-04-27T10:00:00.000Z',
    });
    const res = await handler(makeContext() as never);

    expect(res.headers.get('content-type')).toBe('application/atom+xml; charset=utf-8');
    expect(res.headers.get('etag')).toBe('W/"atom-2026-04-27T10:00:00.000Z"');
    expect(res.headers.get('cache-control')).toBe('public, max-age=300');
    expect(res.headers.get('last-modified')).toBe(new Date('2026-04-27T10:00:00.000Z').toUTCString());
  });

  it('should omit Last-Modified when version is null', async function () {
    const handler = createFeedHandler({
      format: 'rss',
      contentType: 'application/rss+xml',
      render: () => '<rss/>',
      fetchItems: async () => [] as LinkWithTags[],
      getVersion: () => null,
    });
    const res = await handler(makeContext() as never);

    expect(res.headers.get('last-modified')).toBeNull();
    expect(res.headers.get('etag')).toBe('W/"rss-empty"');
  });
});
