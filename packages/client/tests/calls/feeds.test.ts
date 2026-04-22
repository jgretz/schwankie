import {describe, it, expect, beforeEach, afterEach} from 'bun:test';
import {init, reset} from '../../src/config';
import {fetchFeeds} from '../../src/calls/fetch-feeds';
import {createFeed} from '../../src/calls/create-feed';
import {updateFeed} from '../../src/calls/update-feed';
import {deleteFeed} from '../../src/calls/delete-feed';
import {fetchFeedItems} from '../../src/calls/fetch-feed-items';
import {markRssItemRead} from '../../src/calls/mark-rss-item-read';
import {promoteRssItem} from '../../src/calls/promote-rss-item';
import {fetchAllFeeds} from '../../src/calls/fetch-all-feeds';
import {bulkUpsertRssItems} from '../../src/calls/bulk-upsert-rss-items';

const TEST_API_URL = 'http://localhost:3001';
const TEST_API_KEY = 'test-key';

const originalFetch = global.fetch as any;

beforeEach(() => {
  init({apiUrl: TEST_API_URL, apiKey: TEST_API_KEY});
  global.fetch = originalFetch;
});

afterEach(() => {
  reset();
  global.fetch = originalFetch;
});

describe('Feeds Client Calls', () => {
  describe('fetchFeeds', () => {
    it('should fetch user feeds on success', async () => {
      const mockFeeds = [{id: 'feed-1', name: 'Tech News', sourceUrl: 'https://example.com/feed.xml', disabled: false}];
      global.fetch = (async () =>
        new Response(JSON.stringify(mockFeeds), {status: 200, headers: {'Content-Type': 'application/json'}})) as any;

      const result = await fetchFeeds();
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('feed-1');
    });

    it('should throw on HTTP error response', async () => {
      global.fetch = (async () =>
        new Response(JSON.stringify({error: 'Unauthorized'}), {status: 401, headers: {'Content-Type': 'application/json'}})) as any;

      expect(async () => {
        await fetchFeeds();
      }).toThrow();
    });

    it('should throw on network error', async () => {
      global.fetch = (async () => {
        throw new Error('Network failed');
      }) as any;

      expect(async () => {
        await fetchFeeds();
      }).toThrow();
    });
  });

  describe('createFeed', () => {
    it('should create feed on success', async () => {
      const mockFeed = {id: 'feed-1', name: 'Tech News', sourceUrl: 'https://example.com/feed.xml', disabled: false};
      global.fetch = (async () =>
        new Response(JSON.stringify(mockFeed), {status: 201, headers: {'Content-Type': 'application/json'}})) as any;

      const result = await createFeed({name: 'Tech News', sourceUrl: 'https://example.com/feed.xml'});
      expect(result.id).toBe('feed-1');
      expect(result.name).toBe('Tech News');
    });

    it('should throw on validation error', async () => {
      global.fetch = (async () =>
        new Response(JSON.stringify({error: 'Invalid URL'}), {status: 400, headers: {'Content-Type': 'application/json'}})) as any;

      expect(async () => {
        await createFeed({name: 'Tech News', sourceUrl: 'not-a-url'});
      }).toThrow();
    });
  });

  describe('updateFeed', () => {
    it('should update feed on success', async () => {
      const mockFeed = {id: 'feed-1', name: 'Tech News', sourceUrl: 'https://example.com/feed.xml', disabled: true};
      global.fetch = (async () =>
        new Response(JSON.stringify(mockFeed), {status: 200, headers: {'Content-Type': 'application/json'}})) as any;

      const result = await updateFeed('feed-1', {disabled: true});
      expect(result.disabled).toBe(true);
    });

    it('should throw on feed not found', async () => {
      global.fetch = (async () =>
        new Response(JSON.stringify({error: 'Feed not found'}), {status: 404, headers: {'Content-Type': 'application/json'}})) as any;

      expect(async () => {
        await updateFeed('nonexistent', {disabled: true});
      }).toThrow();
    });
  });

  describe('deleteFeed', () => {
    it('should delete feed on success', async () => {
      global.fetch = (async () =>
        new Response(JSON.stringify({deleted: true}), {status: 200, headers: {'Content-Type': 'application/json'}})) as any;

      const result = await deleteFeed('feed-1');
      expect(result.deleted).toBe(true);
    });

    it('should throw on feed not found', async () => {
      global.fetch = (async () =>
        new Response(JSON.stringify({error: 'Feed not found'}), {status: 404, headers: {'Content-Type': 'application/json'}})) as any;

      expect(async () => {
        await deleteFeed('nonexistent');
      }).toThrow();
    });
  });

  describe('fetchFeedItems', () => {
    it('should fetch items with read filter on success', async () => {
      const mockResult = {
        items: [
          {
            id: 'item-1',
            feedId: 'feed-1',
            guid: 'article-1',
            title: 'Article',
            link: 'https://example.com/article',
            read: false,
          },
        ],
        total: 1,
      };
      global.fetch = (async () =>
        new Response(JSON.stringify(mockResult), {status: 200, headers: {'Content-Type': 'application/json'}})) as any;

      const result = await fetchFeedItems({feedId: 'feed-1', read: false});
      expect(result.items.length).toBe(1);
      expect(result.items[0].read).toBe(false);
    });

    it('should throw on HTTP error', async () => {
      global.fetch = (async () =>
        new Response(JSON.stringify({error: 'Not found'}), {status: 404, headers: {'Content-Type': 'application/json'}})) as any;

      expect(async () => {
        await fetchFeedItems({feedId: 'nonexistent'});
      }).toThrow();
    });
  });

  describe('markRssItemRead', () => {
    it('should mark item as read on success', async () => {
      global.fetch = (async () =>
        new Response(JSON.stringify({marked: true}), {status: 200, headers: {'Content-Type': 'application/json'}})) as any;

      const result = await markRssItemRead('feed-1', 'item-1');
      expect(result.marked).toBe(true);
    });

    it('should throw on item not found', async () => {
      global.fetch = (async () =>
        new Response(JSON.stringify({error: 'Item not found'}), {status: 404, headers: {'Content-Type': 'application/json'}})) as any;

      expect(async () => {
        await markRssItemRead('feed-1', 'nonexistent');
      }).toThrow();
    });
  });

  describe('promoteRssItem', () => {
    it('should promote item to link on success', async () => {
      const mockLink = {id: 1, title: 'Article', url: 'https://example.com/article', description: null, imageUrl: null, status: 'unread' as const, content: null, enrichmentFailCount: 0, enrichmentLastError: null, score: null, tags: []};
      global.fetch = (async () =>
        new Response(JSON.stringify(mockLink), {status: 201, headers: {'Content-Type': 'application/json'}})) as any;

      const result = await promoteRssItem('feed-1', 'item-1');
      expect(result.id).toBe(1);
      expect(result.title).toBe('Article');
    });

    it('should throw on item not found', async () => {
      global.fetch = (async () =>
        new Response(JSON.stringify({error: 'Item not found'}), {status: 404, headers: {'Content-Type': 'application/json'}})) as any;

      expect(async () => {
        await promoteRssItem('feed-1', 'nonexistent');
      }).toThrow();
    });
  });

  describe('fetchAllFeeds', () => {
    it('should fetch all feeds on success', async () => {
      const mockFeeds = [
        {id: 'feed-1', name: 'Tech News', sourceUrl: 'https://example.com/feed.xml', disabled: false},
        {id: 'feed-2', name: 'News', sourceUrl: 'https://example.com/news.xml', disabled: false},
      ];
      global.fetch = (async () =>
        new Response(JSON.stringify(mockFeeds), {status: 200, headers: {'Content-Type': 'application/json'}})) as any;

      const result = await fetchAllFeeds();
      expect(result.length).toBe(2);
      expect(result[0].id).toBe('feed-1');
      expect(result[1].id).toBe('feed-2');
    });

    it('should throw on HTTP error', async () => {
      global.fetch = (async () =>
        new Response(JSON.stringify({error: 'Unauthorized'}), {status: 401, headers: {'Content-Type': 'application/json'}})) as any;

      expect(async () => {
        await fetchAllFeeds();
      }).toThrow();
    });
  });

  describe('bulkUpsertRssItems', () => {
    it('should bulk upsert items on success', async () => {
      const mockResult = {inserted: 1};
      global.fetch = (async () =>
        new Response(JSON.stringify(mockResult), {status: 200, headers: {'Content-Type': 'application/json'}})) as any;

      const result = await bulkUpsertRssItems('feed-1', {
        items: [
          {guid: 'article-1', title: 'Article', link: 'https://example.com/article'},
        ],
      });
      expect(result.inserted).toBe(1);
    });

    it('should throw on validation error', async () => {
      global.fetch = (async () =>
        new Response(JSON.stringify({error: 'Invalid request'}), {status: 400, headers: {'Content-Type': 'application/json'}})) as any;

      expect(async () => {
        await bulkUpsertRssItems('feed-1', {items: []});
      }).toThrow();
    });

    it('should throw on HTTP error', async () => {
      global.fetch = (async () =>
        new Response(JSON.stringify({error: 'Feed not found'}), {status: 404, headers: {'Content-Type': 'application/json'}})) as any;

      expect(async () => {
        await bulkUpsertRssItems('nonexistent', {
          items: [
            {guid: 'article-1', title: 'Article', link: 'https://example.com/article'},
          ],
        });
      }).toThrow();
    });
  });
});
