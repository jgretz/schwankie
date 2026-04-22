import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {makeFeed} from '../helpers/factory';
import {deleteFeed} from '../../src/commands/delete-feed';
import {getFeed} from '../../src/queries/get-feed';

describe('deleteFeed', function () {
  setupDb();

  it('should delete an existing feed', async function () {
    const feed = await makeFeed();
    const deleted = await deleteFeed(feed.id);

    expect(deleted).toBe(true);
    const found = await getFeed(feed.id);
    expect(found).toBeNull();
  });

  it('should return false for non-existent feed', async function () {
    const deleted = await deleteFeed('non-existent-id');

    expect(deleted).toBe(false);
  });
});
