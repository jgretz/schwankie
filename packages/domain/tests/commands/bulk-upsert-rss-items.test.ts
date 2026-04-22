import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {makeFeed} from '../helpers/factory';
import {bulkUpsertRssItems} from '../../src/commands/bulk-upsert-rss-items';

describe('bulkUpsertRssItems', function () {
  setupDb();

  it('should return 0 for empty items without touching the db', async function () {
    const result = await bulkUpsertRssItems([]);
    expect(result).toBe(0);
  });

  it('should return the count of rows inserted', async function () {
    const feed = await makeFeed();
    const result = await bulkUpsertRssItems([
      {
        feedId: feed.id,
        guid: 'guid-1',
        title: 'Item 1',
        link: 'https://example.com/1',
        summary: 'Summary',
        content: 'Content',
        imageUrl: 'https://example.com/img.jpg',
        publishedAt: '2024-01-15T10:00:00Z',
      },
      {
        feedId: feed.id,
        guid: 'guid-2',
        title: 'Item 2',
        link: 'https://example.com/2',
      },
    ]);

    expect(result).toBe(2);
  });

  it('should return 0 when every guid collides (onConflictDoNothing)', async function () {
    const feed = await makeFeed();
    const items = [
      {feedId: feed.id, guid: 'dup-guid', title: 'First', link: 'https://example.com/1'},
    ];

    const first = await bulkUpsertRssItems(items);
    expect(first).toBe(1);

    const second = await bulkUpsertRssItems(items);
    expect(second).toBe(0);
  });

  it('should insert only the new rows when some guids collide', async function () {
    const feed = await makeFeed();

    await bulkUpsertRssItems([
      {feedId: feed.id, guid: 'existing', title: 'Existing', link: 'https://example.com/1'},
    ]);

    const result = await bulkUpsertRssItems([
      {feedId: feed.id, guid: 'existing', title: 'Existing', link: 'https://example.com/1'},
      {feedId: feed.id, guid: 'new', title: 'New', link: 'https://example.com/2'},
    ]);

    expect(result).toBe(1);
  });
});
