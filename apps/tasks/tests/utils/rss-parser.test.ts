import {describe, it, expect, beforeEach, afterEach} from 'bun:test';
import {parseFeed, getErrorMessage} from '../../src/utils/rss-parser';

// Mock fetch to return fixture XML
let mockFetchResult: {ok: boolean; text: () => Promise<string>} | null = null;
const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = (async () => mockFetchResult) as any;
});

afterEach(() => {
  global.fetch = originalFetch;
  mockFetchResult = null;
});

describe('RSS Parser', () => {
  describe('parseFeed', () => {
    it('should parse feed with content:encoded and media fields', async () => {
      const fixtureXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Test Feed</title>
    <item>
      <title>Article One</title>
      <guid>article-1</guid>
      <link>https://example.com/article-1</link>
      <pubDate>Sat, 22 Apr 2026 10:00:00 GMT</pubDate>
      <description>Summary here</description>
      <content:encoded><![CDATA[<p>Full content with HTML</p>]]></content:encoded>
      <media:thumbnail url="https://example.com/thumb.jpg" />
    </item>
    <item>
      <title>Article Two</title>
      <guid>article-2</guid>
      <link>https://example.com/article-2</link>
      <pubDate>Sat, 22 Apr 2026 09:00:00 GMT</pubDate>
      <content:encoded><![CDATA[Another article]]></content:encoded>
    </item>
  </channel>
</rss>`;

      mockFetchResult = {
        ok: true,
        text: async () => fixtureXml,
      };

      const items = await parseFeed('https://example.com/feed.xml');
      expect(items.length).toBe(2);
      expect(items[0].guid).toBe('article-1');
      expect(items[0].title).toBe('Article One');
      expect(items[0].content).toBe('<p>Full content with HTML</p>');
      expect(items[0].imageUrl).toBe('https://example.com/thumb.jpg');
      expect(items[1].content).toBe('Another article');
    });

    it('should filter items older than 30 days', async () => {
      const thirtyOneAgo = new Date();
      thirtyOneAgo.setDate(thirtyOneAgo.getDate() - 31);

      const fixtureXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Test Feed</title>
    <item>
      <title>Recent Article</title>
      <guid>recent</guid>
      <link>https://example.com/recent</link>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <content:encoded>Recent content</content:encoded>
    </item>
    <item>
      <title>Old Article</title>
      <guid>old</guid>
      <link>https://example.com/old</link>
      <pubDate>${thirtyOneAgo.toUTCString()}</pubDate>
      <content:encoded>Old content</content:encoded>
    </item>
  </channel>
</rss>`;

      mockFetchResult = {
        ok: true,
        text: async () => fixtureXml,
      };

      const items = await parseFeed('https://example.com/feed.xml');
      expect(items.length).toBe(1);
      expect(items[0].guid).toBe('recent');
    });

    it('should deduplicate items by guid', async () => {
      const fixtureXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Test Feed</title>
    <item>
      <title>Article</title>
      <guid>article-1</guid>
      <link>https://example.com/article-1</link>
      <pubDate>Sat, 22 Apr 2026 10:00:00 GMT</pubDate>
      <content:encoded>Content</content:encoded>
    </item>
    <item>
      <title>Article</title>
      <guid>article-1</guid>
      <link>https://example.com/article-1</link>
      <pubDate>Sat, 22 Apr 2026 10:00:00 GMT</pubDate>
      <content:encoded>Content</content:encoded>
    </item>
  </channel>
</rss>`;

      mockFetchResult = {
        ok: true,
        text: async () => fixtureXml,
      };

      const items = await parseFeed('https://example.com/feed.xml');
      expect(items.length).toBe(1);
      expect(items[0].guid).toBe('article-1');
    });

    it('should strip HTML from title and summary', async () => {
      const fixtureXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Test Feed</title>
    <item>
      <title>&lt;b&gt;Bold&lt;/b&gt; Title</title>
      <guid>article-1</guid>
      <link>https://example.com/article-1</link>
      <pubDate>Sat, 22 Apr 2026 10:00:00 GMT</pubDate>
      <description>&lt;p&gt;HTML summary&lt;/p&gt;</description>
      <content:encoded><![CDATA[<p>Full content</p>]]></content:encoded>
    </item>
  </channel>
</rss>`;

      mockFetchResult = {
        ok: true,
        text: async () => fixtureXml,
      };

      const items = await parseFeed('https://example.com/feed.xml');
      expect(items[0].title).not.toContain('<');
      expect(items[0].title).not.toContain('>');
      expect(items[0].summary).not.toContain('<');
    });

    it('should handle feed with no items', async () => {
      const fixtureXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Empty Feed</title>
  </channel>
</rss>`;

      mockFetchResult = {
        ok: true,
        text: async () => fixtureXml,
      };

      const items = await parseFeed('https://example.com/feed.xml');
      expect(items.length).toBe(0);
    });

    it('should throw on network error', async () => {
      global.fetch = (async () => {
        throw new Error('Network failed');
      }) as any;

      expect(async () => {
        await parseFeed('https://example.com/feed.xml');
      }).toThrow();
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from Error objects', () => {
      const error = new Error('Test error');
      expect(getErrorMessage(error)).toBe('Test error');
    });

    it('should convert strings to string', () => {
      expect(getErrorMessage('error message')).toBe('error message');
    });

    it('should convert unknown types to string', () => {
      expect(getErrorMessage({reason: 'unknown'})).toBe('[object Object]');
    });
  });
});
