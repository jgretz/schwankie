import {describe, expect, it} from 'bun:test';
import type {FeedData} from 'client';
import {sortFeedsByUpdatedAt} from '../../src/lib/sort-feeds';

function makeFeed(overrides: Partial<FeedData> & {id: string}): FeedData {
  return {
    name: `Feed ${overrides.id}`,
    sourceUrl: `https://example.com/${overrides.id}.xml`,
    disabled: false,
    errorCount: 0,
    lastError: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('sortFeedsByUpdatedAt', function () {
  it('should order feeds newest updatedAt first', function () {
    const feeds = [
      makeFeed({id: 'a', updatedAt: '2026-01-01T00:00:00.000Z'}),
      makeFeed({id: 'b', updatedAt: '2026-03-01T00:00:00.000Z'}),
      makeFeed({id: 'c', updatedAt: '2026-02-01T00:00:00.000Z'}),
    ];

    const result = sortFeedsByUpdatedAt(feeds);

    expect(result.map((f) => f.id)).toEqual(['b', 'c', 'a']);
  });

  it('should not mutate the input array', function () {
    const feeds = [
      makeFeed({id: 'a', updatedAt: '2026-01-01T00:00:00.000Z'}),
      makeFeed({id: 'b', updatedAt: '2026-03-01T00:00:00.000Z'}),
    ];

    sortFeedsByUpdatedAt(feeds);

    expect(feeds.map((f) => f.id)).toEqual(['a', 'b']);
  });

  it('should sort an unparseable updatedAt last', function () {
    const feeds = [
      makeFeed({id: 'bad', updatedAt: 'not-a-date'}),
      makeFeed({id: 'good', updatedAt: '2026-01-01T00:00:00.000Z'}),
    ];

    const result = sortFeedsByUpdatedAt(feeds);

    expect(result.map((f) => f.id)).toEqual(['good', 'bad']);
  });

  it('should sort a missing updatedAt last', function () {
    const feeds = [
      makeFeed({id: 'empty', updatedAt: ''}),
      makeFeed({id: 'good', updatedAt: '2026-01-01T00:00:00.000Z'}),
    ];

    const result = sortFeedsByUpdatedAt(feeds);

    expect(result.map((f) => f.id)).toEqual(['good', 'empty']);
  });

  // Ties are common: every feed fetched in the same poll shares a timestamp.
  it('should preserve the input order for equal timestamps', function () {
    const feeds = [
      makeFeed({id: 'a', updatedAt: '2026-01-01T00:00:00.000Z'}),
      makeFeed({id: 'b', updatedAt: '2026-01-01T00:00:00.000Z'}),
      makeFeed({id: 'c', updatedAt: '2026-01-01T00:00:00.000Z'}),
    ];

    const result = sortFeedsByUpdatedAt(feeds);

    expect(result.map((f) => f.id)).toEqual(['a', 'b', 'c']);
  });

  it('should return an empty array for no feeds', function () {
    expect(sortFeedsByUpdatedAt([])).toEqual([]);
  });
});
