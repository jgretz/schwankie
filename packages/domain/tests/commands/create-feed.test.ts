import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {makeFeed} from '../helpers/factory';

describe('createFeed', function () {
  setupDb();

  it('should create a feed with required fields', async function () {
    const result = await makeFeed({name: 'Test Feed', sourceUrl: 'https://example.com/feed.xml'});

    expect(result.name).toBe('Test Feed');
    expect(result.sourceUrl).toBe('https://example.com/feed.xml');
    expect(result.disabled).toBe(false);
    expect(result.errorCount).toBe(0);
    expect(result.id).toBeDefined();
  });

  it('should set default values', async function () {
    const result = await makeFeed();

    expect(result.disabled).toBe(false);
    expect(result.errorCount).toBe(0);
    expect(result.lastFetchedAt).toBeNull();
    expect(result.lastError).toBeNull();
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
  });

  it('should accept name and sourceUrl overrides', async function () {
    const result = await makeFeed({
      name: 'Custom Feed',
      sourceUrl: 'https://custom.example.com/feed.xml',
    });

    expect(result.name).toBe('Custom Feed');
    expect(result.sourceUrl).toBe('https://custom.example.com/feed.xml');
  });
});
