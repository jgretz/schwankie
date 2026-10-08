import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {makeFeed, makeRssItem} from '../helpers/factory';
import {markRssItemOpened} from '../../src/commands/mark-rss-item-opened';

describe('markRssItemOpened', function () {
  setupDb();

  it('should record the open time when an item is opened', async function () {
    const feed = await makeFeed();
    const item = await makeRssItem(feed.id);
    const before = Date.now();

    const updated = await markRssItemOpened(item!.id);

    expect(updated?.openedAt?.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('should mark the item read when it is opened', async function () {
    const feed = await makeFeed();
    const item = await makeRssItem(feed.id);

    const updated = await markRssItemOpened(item!.id);

    expect(updated?.read).toBe(true);
  });

  it('should leave promoted unchanged when an item is opened', async function () {
    const feed = await makeFeed();
    const item = await makeRssItem(feed.id);

    const updated = await markRssItemOpened(item!.id);

    expect(updated?.promoted).toBe(false);
  });

  it('should return null for non-existent item', async function () {
    const updated = await markRssItemOpened('non-existent-id');

    expect(updated).toBeNull();
  });
});
