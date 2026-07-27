import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {makeEmailItem, makeFeed, makeRssItem} from '../helpers/factory';
import {updateFeed} from '../../src/commands/update-feed';
import {listDigestSourceItems} from '../../src/queries/list-digest-source-items';

const NOW = new Date('2026-07-27T11:00:00Z');

function hoursBefore(n: number): Date {
  return new Date(NOW.getTime() - n * 60 * 60 * 1000);
}

describe('listDigestSourceItems', function () {
  setupDb();

  it('should return items from both sources inside the window', async function () {
    const feed = await makeFeed();
    await makeRssItem(feed!.id, {
      title: 'An rss article',
      link: 'https://example.com/rss-one',
      createdAt: hoursBefore(2),
    });
    await makeEmailItem({
      title: 'A newsletter article',
      link: 'https://example.com/email-one',
      importedAt: hoursBefore(3),
    });

    const result = await listDigestSourceItems({hours: 24, now: NOW});

    expect(result.count).toBe(2);
    expect(result.items.map((i) => i.sourceKind).sort()).toEqual(['email', 'rss']);
  });

  it('should exclude items older than the window', async function () {
    const feed = await makeFeed();
    await makeRssItem(feed!.id, {
      title: 'Too old',
      link: 'https://example.com/old',
      createdAt: hoursBefore(30),
    });
    await makeEmailItem({
      title: 'Also too old',
      link: 'https://example.com/old-email',
      importedAt: hoursBefore(25),
    });

    const result = await listDigestSourceItems({hours: 24, now: NOW});

    expect(result.count).toBe(0);
  });

  it('should honour a shorter lookback', async function () {
    const feed = await makeFeed();
    await makeRssItem(feed!.id, {
      title: 'Recent',
      link: 'https://example.com/recent',
      createdAt: hoursBefore(2),
    });
    await makeRssItem(feed!.id, {
      title: 'Older',
      link: 'https://example.com/older',
      createdAt: hoursBefore(10),
    });

    const result = await listDigestSourceItems({hours: 6, now: NOW});

    expect(result.count).toBe(1);
    expect(result.items[0]!.title).toBe('Recent');
  });

  it('should exclude items from disabled feeds', async function () {
    const enabled = await makeFeed({name: 'Enabled'});
    const disabled = await makeFeed({name: 'Disabled'});
    await updateFeed(disabled!.id, {disabled: true});
    await makeRssItem(enabled!.id, {
      title: 'Kept',
      link: 'https://example.com/kept',
      createdAt: hoursBefore(1),
    });
    await makeRssItem(disabled!.id, {
      title: 'Dropped',
      link: 'https://example.com/dropped',
      createdAt: hoursBefore(1),
    });

    const result = await listDigestSourceItems({hours: 24, now: NOW});

    expect(result.count).toBe(1);
    expect(result.items[0]!.title).toBe('Kept');
  });

  it('should drop filler items', async function () {
    const feed = await makeFeed();
    await makeRssItem(feed!.id, {
      title: 'Wordle today: the answer',
      link: 'https://example.com/wordle',
      createdAt: hoursBefore(1),
    });
    await makeRssItem(feed!.id, {
      title: 'A real article',
      link: 'https://example.com/real',
      createdAt: hoursBefore(1),
    });

    const result = await listDigestSourceItems({hours: 24, now: NOW});

    expect(result.count).toBe(1);
    expect(result.items[0]!.title).toBe('A real article');
  });

  it('should collapse the same article arriving from two sources', async function () {
    const feed = await makeFeed();
    await makeRssItem(feed!.id, {
      title: 'Shared story',
      link: 'https://example.com/shared',
      createdAt: hoursBefore(1),
    });
    await makeEmailItem({
      title: 'Shared story via newsletter',
      link: 'https://example.com/shared?utm_source=news',
      importedAt: hoursBefore(4),
    });

    const result = await listDigestSourceItems({hours: 24, now: NOW});

    expect(result.count).toBe(1);
    // Newest wins — items are sorted by ingestion time before deduping.
    expect(result.items[0]!.title).toBe('Shared story');
  });

  it('should fall back to the url when an email item has no title', async function () {
    await makeEmailItem({
      title: undefined,
      link: 'https://example.com/untitled',
      importedAt: hoursBefore(1),
    });

    const result = await listDigestSourceItems({hours: 24, now: NOW});

    expect(result.items[0]!.title).toBe('https://example.com/untitled');
  });

  it('should report the window bounds it used', async function () {
    const result = await listDigestSourceItems({hours: 24, now: NOW});

    expect(result.windowEnd).toBe('2026-07-27T11:00:00.000Z');
    expect(result.windowStart).toBe('2026-07-26T11:00:00.000Z');
  });

  it('should return an empty window rather than failing', async function () {
    const result = await listDigestSourceItems({hours: 24, now: NOW});

    expect(result.items).toEqual([]);
    expect(result.count).toBe(0);
  });
});
