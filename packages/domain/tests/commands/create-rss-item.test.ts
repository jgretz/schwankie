import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {makeFeed, makeRssItem} from '../helpers/factory';
import {createRssItem} from '../../src/commands/create-rss-item';

describe('createRssItem', function () {
  setupDb();

  it('should create an rss item', async function () {
    const feed = await makeFeed();
    const result = await makeRssItem(feed.id, {title: 'Test Article'});

    expect(result).not.toBeNull();
    expect(result?.feedId).toBe(feed.id);
    expect(result?.title).toBe('Test Article');
    expect(result?.read).toBe(false);
    expect(result?.clicked).toBe(false);
  });

  it('should return null on conflict (duplicate guid)', async function () {
    const feed = await makeFeed();
    const guid = `unique-guid-${Date.now()}`;

    const first = await createRssItem({
      feedId: feed.id,
      guid,
      title: 'First Article',
      link: 'https://example.com/1',
    });

    expect(first).not.toBeNull();

    const duplicate = await createRssItem({
      feedId: feed.id,
      guid,
      title: 'Duplicate Article',
      link: 'https://example.com/2',
    });

    expect(duplicate).toBeNull();
  });

  it('should set optional fields', async function () {
    const feed = await makeFeed();
    const result = await makeRssItem(feed.id, {
      summary: 'Test summary',
      imageUrl: 'https://example.com/image.jpg',
    });

    expect(result?.summary).toBe('Test summary');
    expect(result?.imageUrl).toBe('https://example.com/image.jpg');
  });
});
