import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {makeFeed} from '../helpers/factory';
import {updateFeed} from '../../src/commands/update-feed';

describe('updateFeed', function () {
  setupDb();

  it('should update feed name', async function () {
    const feed = await makeFeed({name: 'Original Name'});
    const updated = await updateFeed(feed.id, {name: 'Updated Name'});

    expect(updated).not.toBeNull();
    expect(updated?.name).toBe('Updated Name');
    expect(updated?.sourceUrl).toBe(feed.sourceUrl);
  });

  it('should update disabled status', async function () {
    const feed = await makeFeed();
    const updated = await updateFeed(feed.id, {disabled: true});

    expect(updated?.disabled).toBe(true);
  });

  it('should update error count', async function () {
    const feed = await makeFeed();
    const updated = await updateFeed(feed.id, {errorCount: 3});

    expect(updated?.errorCount).toBe(3);
  });

  it('should update last error', async function () {
    const feed = await makeFeed();
    const updated = await updateFeed(feed.id, {lastError: 'Network timeout'});

    expect(updated?.lastError).toBe('Network timeout');
  });

  it('should return null for non-existent feed', async function () {
    const updated = await updateFeed('non-existent-id', {name: 'Updated'});

    expect(updated).toBeNull();
  });

  it('should update lastFetchedAt', async function () {
    const feed = await makeFeed();
    const now = new Date();
    const updated = await updateFeed(feed.id, {lastFetchedAt: now.toISOString()});

    expect(updated?.lastFetchedAt).toBeDefined();
  });
});
