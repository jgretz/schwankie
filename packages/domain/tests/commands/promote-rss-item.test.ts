import {describe, expect, it} from 'bun:test';
import {setupDb, store} from '../helpers/setup';
import {makeFeed, makeRssItem} from '../helpers/factory';
import {promoteRssItem} from '../../src/commands/promote-rss-item';
import {getLink} from '../../src/queries/get-link';

describe('promoteRssItem', function () {
  setupDb();

  it('should promote an rss item to a link', async function () {
    const feed = await makeFeed();
    const item = await makeRssItem(feed.id, {
      title: 'Test Article',
      link: 'https://example.com/article',
      summary: 'Test summary',
    });

    const linkId = await promoteRssItem(item!.id);

    expect(linkId).toBeDefined();
    expect(linkId).toBeGreaterThan(0);
  });

  it('should create link with queued status and null content', async function () {
    const feed = await makeFeed();
    const item = await makeRssItem(feed.id, {
      title: 'Test Article',
      link: 'https://example.com/article',
    });

    const linkId = await promoteRssItem(item!.id);
    const link = await getLink(linkId!);

    expect(link?.status).toBe('queued');
    expect(link?.content).toBeNull();
  });

  it('should copy item data to link', async function () {
    const feed = await makeFeed();
    const item = await makeRssItem(feed.id, {
      title: 'My Article',
      link: 'https://source.example.com/article',
      summary: 'Article summary text',
      imageUrl: 'https://example.com/image.jpg',
    });

    const linkId = await promoteRssItem(item!.id);
    const link = await getLink(linkId!);

    expect(link?.url).toBe('https://source.example.com/article');
    expect(link?.title).toBe('My Article');
    expect(link?.description).toBe('Article summary text');
    expect(link?.imageUrl).toBe('https://example.com/image.jpg');
  });

  it('should mark item as clicked', async function () {
    const feed = await makeFeed();
    const item = await makeRssItem(feed.id);

    await promoteRssItem(item!.id);

    const updatedItem = store.rssItems.find((i) => i.id === item!.id);
    expect(updatedItem?.clicked).toBe(true);
  });

  it('should return null for non-existent item', async function () {
    const linkId = await promoteRssItem('non-existent-id');

    expect(linkId).toBeNull();
  });
});
