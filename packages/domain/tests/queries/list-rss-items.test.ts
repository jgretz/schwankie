import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {makeFeed, makeRssItem} from '../helpers/factory';
import {listRssItems} from '../../src/queries/list-rss-items';
import {markRssItemRead} from '../../src/commands/mark-rss-item-read';

describe('listRssItems', function () {
  setupDb();

  it('should return empty list for feed with no items', async function () {
    const feed = await makeFeed();

    const result = await listRssItems({feedId: feed.id});

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.hasMore).toBe(false);
  });

  it('should list all items in a feed', async function () {
    const feed = await makeFeed();
    await makeRssItem(feed.id, {title: 'Article 1'});
    await makeRssItem(feed.id, {title: 'Article 2'});

    const result = await listRssItems({feedId: feed.id});

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should filter by read status', async function () {
    const feed = await makeFeed();
    const item1 = await makeRssItem(feed.id);
    await makeRssItem(feed.id);

    await markRssItemRead(item1!.id);

    const unread = await listRssItems({feedId: feed.id, read: false});
    const read = await listRssItems({feedId: feed.id, read: true});

    expect(unread.items).toHaveLength(1);
    expect(read.items).toHaveLength(1);
  });

  it('should support pagination', async function () {
    const feed = await makeFeed();
    await makeRssItem(feed.id, {title: 'Item 1'});
    await makeRssItem(feed.id, {title: 'Item 2'});
    await makeRssItem(feed.id, {title: 'Item 3'});

    const page1 = await listRssItems({feedId: feed.id, limit: 2, offset: 0});
    const page2 = await listRssItems({feedId: feed.id, limit: 2, offset: 2});

    expect(page1.items).toHaveLength(2);
    expect(page1.hasMore).toBe(true);
    expect(page2.items).toHaveLength(1);
    expect(page2.hasMore).toBe(false);
  });

  it('should filter by clicked status', async function () {
    const feed = await makeFeed();
    const item1 = await makeRssItem(feed.id);
    await makeRssItem(feed.id);

    await markRssItemRead(item1!.id, true);

    const notClicked = await listRssItems({feedId: feed.id, clicked: false});
    const clicked = await listRssItems({feedId: feed.id, clicked: true});

    expect(notClicked.items).toHaveLength(1);
    expect(clicked.items).toHaveLength(1);
  });

  it('should search by title', async function () {
    const feed = await makeFeed();
    await makeRssItem(feed.id, {title: 'TypeScript Guide'});
    await makeRssItem(feed.id, {title: 'JavaScript Basics'});
    await makeRssItem(feed.id, {title: 'Python Tutorial'});

    const result = await listRssItems({feedId: feed.id, q: 'script'});

    expect(result.items).toHaveLength(2);
  });
});
