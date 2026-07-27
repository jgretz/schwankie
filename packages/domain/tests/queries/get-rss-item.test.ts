import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {makeFeed, makeRssItem} from '../helpers/factory';
import {getRssItem} from '../../src/queries/get-rss-item';

describe('getRssItem', function () {
  setupDb();

  it('should get rss item by id', async function () {
    const feed = await makeFeed();
    const created = await makeRssItem(feed!.id, {
      title: 'Bubbles',
      link: 'https://example.com/bubbles',
    });

    const found = await getRssItem(created!.id);

    expect(found).not.toBeNull();
    expect(found!.id).toBe(created!.id);
    expect(found!.title).toBe('Bubbles');
    expect(found!.link).toBe('https://example.com/bubbles');
  });

  it('should return null for non-existent item', async function () {
    const result = await getRssItem('00000000-0000-0000-0000-000000000000');

    expect(result).toBeNull();
  });
});
