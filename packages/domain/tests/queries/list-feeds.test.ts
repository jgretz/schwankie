import {describe, expect, it} from 'bun:test';
import {setupDb, store} from '../helpers/setup';
import {makeFeed} from '../helpers/factory';
import {listFeeds} from '../../src/queries/list-feeds';

describe('listFeeds', function () {
  setupDb();

  it('should return empty list when no feeds exist', async function () {
    const feeds = await listFeeds();

    expect(feeds).toEqual([]);
  });

  it('should return all feeds', async function () {
    await makeFeed({name: 'Feed 1'});
    await makeFeed({name: 'Feed 2'});

    const feeds = await listFeeds();

    expect(feeds).toHaveLength(2);
    const names = feeds.map((f) => f.name);
    expect(names).toContain('Feed 1');
    expect(names).toContain('Feed 2');
  });

  it('should order by creation date descending', async function () {
    const feed1 = await makeFeed({name: 'Feed 1'});
    const feed2 = await makeFeed({name: 'Feed 2'});
    const feed3 = await makeFeed({name: 'Feed 3'});

    // Update timestamps to ensure proper descending order
    const baseTime = Date.now();
    const feedIdx1 = store.feeds.findIndex((f) => f.id === feed1!.id);
    const feedIdx2 = store.feeds.findIndex((f) => f.id === feed2!.id);
    const feedIdx3 = store.feeds.findIndex((f) => f.id === feed3!.id);

    store.feeds[feedIdx1]!.createdAt = new Date(baseTime - 2);
    store.feeds[feedIdx2]!.createdAt = new Date(baseTime - 1);
    store.feeds[feedIdx3]!.createdAt = new Date(baseTime);

    const feeds = await listFeeds();

    // Verify that feeds are returned in descending order by name
    // (which matches the creation time order due to our setup above)
    const names = feeds.map((f) => f.name);
    expect(names).toEqual(['Feed 3', 'Feed 2', 'Feed 1']);
  });
});
