import {describe, it, expect} from 'bun:test';
import {
  createFeedSchema,
  updateFeedSchema,
  bulkUpsertItemsSchema,
  listFeedItemsSchema,
} from '../../src/validators/feeds';

describe('Feed Validators', () => {
  describe('createFeedSchema', () => {
    it('should validate valid feed input', () => {
      const valid = {name: 'Tech News', sourceUrl: 'https://example.com/feed.xml'};
      const result = createFeedSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject missing name', () => {
      const invalid = {sourceUrl: 'https://example.com/feed.xml'};
      const result = createFeedSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject invalid sourceUrl', () => {
      const invalid = {name: 'Tech News', sourceUrl: 'not-a-url'};
      const result = createFeedSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject empty name', () => {
      const invalid = {name: '', sourceUrl: 'https://example.com/feed.xml'};
      const result = createFeedSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('updateFeedSchema', () => {
    it('should validate partial updates', () => {
      const valid = {disabled: true};
      const result = updateFeedSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate empty update', () => {
      const valid = {};
      const result = updateFeedSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject invalid disabled value', () => {
      const invalid = {disabled: 'true'};
      const result = updateFeedSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('bulkUpsertItemsSchema', () => {
    it('should validate valid rss items', () => {
      const valid = {
        items: [
          {
            guid: 'item-1',
            title: 'Article',
            link: 'https://example.com/article',
          },
        ],
      };
      const result = bulkUpsertItemsSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should accept optional fields', () => {
      const valid = {
        items: [
          {
            guid: 'item-1',
            title: 'Article',
            link: 'https://example.com/article',
            summary: 'A summary',
            content: 'Raw content',
            imageUrl: 'https://example.com/image.jpg',
            pubDate: '2026-04-22T00:00:00Z',
          },
        ],
      };
      const result = bulkUpsertItemsSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should accept empty items array', () => {
      const valid = {items: []};
      const result = bulkUpsertItemsSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject invalid link URL', () => {
      const invalid = {
        items: [
          {
            guid: 'item-1',
            title: 'Article',
            link: 'not-a-url',
          },
        ],
      };
      const result = bulkUpsertItemsSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('listFeedItemsSchema', () => {
    it('should validate with read filter', () => {
      const valid = {feedId: 'feed-1', read: true};
      const result = listFeedItemsSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate with required feedId only', () => {
      const valid = {feedId: 'feed-1'};
      const result = listFeedItemsSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject missing feedId', () => {
      const invalid = {read: true};
      const result = listFeedItemsSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should validate with clicked filter', () => {
      const valid = {feedId: 'feed-1', clicked: true};
      const result = listFeedItemsSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });
});
