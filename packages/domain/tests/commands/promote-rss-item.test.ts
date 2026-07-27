import {describe, expect, it} from 'bun:test';
import {setupDb, store} from '../helpers/setup';
import {makeFeed, makeRssItem} from '../helpers/factory';
import {promoteRssItem} from '../../src/commands/promote-rss-item';
import {getLink} from '../../src/queries/get-link';
import {DomainValidationError} from '../../src/lib/errors';

const ELLIPSIS = '…';

function repeat(char: string, count: number): string {
  return Array.from({length: count}, () => char).join('');
}

function codePoints(value: string): number {
  return Array.from(value).length;
}

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

  describe('destination column bounds', function () {
    it('should truncate an over-long title to 500 code points', async function () {
      const feed = await makeFeed();
      const item = await makeRssItem(feed.id, {title: repeat('a', 900)});

      const linkId = await promoteRssItem(item!.id);
      const link = await getLink(linkId!);

      expect(codePoints(link!.title)).toBe(500);
      expect(link!.title.endsWith(ELLIPSIS)).toBe(true);
    });

    // The Bubbles regression: rss_item.summary is unbounded text, but
    // link.description is varchar(800).
    it('should truncate an over-long summary to 800 code points', async function () {
      const feed = await makeFeed();
      const item = await makeRssItem(feed.id, {summary: repeat('a', 76386)});

      const linkId = await promoteRssItem(item!.id);
      const link = await getLink(linkId!);

      expect(codePoints(link!.description!)).toBe(800);
      expect(link!.description!.endsWith(ELLIPSIS)).toBe(true);
    });

    it('should drop an over-long image url', async function () {
      const feed = await makeFeed();
      const item = await makeRssItem(feed.id, {
        imageUrl: `https://example.com/${repeat('a', 2100)}.jpg`,
      });

      const linkId = await promoteRssItem(item!.id);
      const link = await getLink(linkId!);

      expect(link!.imageUrl).toBeNull();
    });

    it('should throw DomainValidationError for an over-long link', async function () {
      const feed = await makeFeed();
      const item = await makeRssItem(feed.id, {
        link: `https://example.com/${repeat('a', 2100)}`,
      });

      let caught: unknown;
      try {
        await promoteRssItem(item!.id);
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(DomainValidationError);
      expect((caught as DomainValidationError).field).toBe('url');
    });
  });
});
