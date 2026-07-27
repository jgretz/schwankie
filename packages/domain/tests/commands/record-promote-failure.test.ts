import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {recordPromoteFailure} from '../../src/commands/record-promote-failure';

describe('recordPromoteFailure', function () {
  setupDb();

  it('should persist every supplied field', async function () {
    const row = await recordPromoteFailure({
      source: 'rss',
      sourceItemId: 'item-1',
      url: 'https://example.com/a',
      title: 'Bubbles',
      errorMessage: 'url exceeds the maximum of 2048 characters',
      errorCode: 'DOMAIN_VALIDATION',
    });

    expect(row.source).toBe('rss');
    expect(row.sourceItemId).toBe('item-1');
    expect(row.url).toBe('https://example.com/a');
    expect(row.title).toBe('Bubbles');
    expect(row.errorMessage).toBe('url exceeds the maximum of 2048 characters');
    expect(row.errorCode).toBe('DOMAIN_VALIDATION');
  });

  it('should default the optional fields to null when omitted', async function () {
    const row = await recordPromoteFailure({
      source: 'email',
      sourceItemId: 'item-2',
      errorMessage: 'boom',
    });

    expect(row.url).toBeNull();
    expect(row.title).toBeNull();
    expect(row.errorCode).toBeNull();
  });

  it('should populate createdAt', async function () {
    const row = await recordPromoteFailure({
      source: 'rss',
      sourceItemId: 'item-3',
      errorMessage: 'boom',
    });

    expect(row.createdAt).toBeInstanceOf(Date);
  });

  it('should store an over-length error message verbatim', async function () {
    const message = 'x'.repeat(5000);

    const row = await recordPromoteFailure({
      source: 'rss',
      sourceItemId: 'item-4',
      errorMessage: message,
    });

    expect(row.errorMessage).toHaveLength(5000);
  });
});
