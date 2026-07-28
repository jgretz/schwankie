import {describe, expect, it} from 'bun:test';
import type {FeedData} from 'client';
import {filterFeeds} from '../../src/lib/filter-feeds';

function makeFeed(id: string, name: string, sourceUrl: string): FeedData {
  return {
    id,
    name,
    sourceUrl,
    disabled: false,
    errorCount: 0,
    lastError: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

const FEEDS = [
  makeFeed('a', 'Daring Fireball', 'https://daringfireball.net/feed.xml'),
  makeFeed('b', 'Simon Willison', 'https://simonwillison.net/atom/everything/'),
];

describe('filterFeeds', function () {
  it('should return the input array as-is for an empty query', function () {
    expect(filterFeeds(FEEDS, '')).toBe(FEEDS);
  });

  it('should match on the feed name', function () {
    const result = filterFeeds(FEEDS, 'Fireball');

    expect(result.map((f) => f.id)).toEqual(['a']);
  });

  it('should match on the source URL', function () {
    const result = filterFeeds(FEEDS, 'simonwillison');

    expect(result.map((f) => f.id)).toEqual(['b']);
  });

  it('should match case-insensitively', function () {
    expect(filterFeeds(FEEDS, 'dArInG').map((f) => f.id)).toEqual(['a']);
    expect(filterFeeds(FEEDS, 'ATOM').map((f) => f.id)).toEqual(['b']);
  });

  it('should return an empty array when nothing matches', function () {
    expect(filterFeeds(FEEDS, 'nonesuch')).toEqual([]);
  });

  it('should not mutate the input array', function () {
    filterFeeds(FEEDS, 'Fireball');

    expect(FEEDS.map((f) => f.id)).toEqual(['a', 'b']);
  });

  it('should not trim the query', function () {
    expect(filterFeeds(FEEDS, 'Fireball ')).toEqual([]);
  });
});
