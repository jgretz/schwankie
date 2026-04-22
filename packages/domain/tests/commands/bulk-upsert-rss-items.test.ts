import {mock, describe, it, expect} from 'bun:test';

const mockReturning = mock(async () => [] as any[]);
const mockOnConflictDoNothing = mock(() => ({returning: mockReturning}));
const mockValues = mock(() => ({onConflictDoNothing: mockOnConflictDoNothing}));
const mockInsert = mock(() => ({values: mockValues}));

mock.module('../db', () => ({
  getDb: () =>
    ({
      insert: mockInsert,
    }) as any,
}));

const {bulkUpsertRssItems} = await import('../../src/commands/bulk-upsert-rss-items');

describe('bulkUpsertRssItems', () => {
  it('should return 0 for empty items', async () => {
    const result = await bulkUpsertRssItems([]);
    expect(result).toBe(0);
  });

  it('should upsert items and return count', async () => {
    const items = [
      {
        feedId: 'feed-1',
        guid: 'guid-1',
        title: 'Item 1',
        link: 'https://example.com/1',
        summary: 'Summary',
        content: 'Content',
        imageUrl: 'https://example.com/img.jpg',
        publishedAt: '2024-01-15T10:00:00Z',
      },
    ];

    const result = await bulkUpsertRssItems(items);
    expect(result).toBe(0);
  });

  it('should handle undefined dates', async () => {
    const items = [
      {
        feedId: 'feed-1',
        guid: 'guid-1',
        title: 'Item',
        link: 'https://example.com/1',
        summary: undefined,
        content: undefined,
        imageUrl: undefined,
        publishedAt: undefined,
      },
    ];

    const result = await bulkUpsertRssItems(items);
    expect(result).toBe(0);
  });
});
