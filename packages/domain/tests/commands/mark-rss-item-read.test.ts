import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {makeFeed, makeRssItem} from '../helpers/factory';
import {markRssItemRead} from '../../src/commands/mark-rss-item-read';

describe('markRssItemRead', function () {
  setupDb();

  it('should mark an item as read', async function () {
    const feed = await makeFeed();
    const item = await makeRssItem(feed.id);

    expect(item?.read).toBe(false);

    const updated = await markRssItemRead(item!.id);

    expect(updated?.read).toBe(true);
  });

  it('should mark clicked without changing read', async function () {
    const feed = await makeFeed();
    const item = await makeRssItem(feed.id);

    const updated = await markRssItemRead(item!.id, true);

    expect(updated?.read).toBe(true);
    expect(updated?.clicked).toBe(true);
  });

  it('should return null for non-existent item', async function () {
    const updated = await markRssItemRead('non-existent-id');

    expect(updated).toBeNull();
  });
});
