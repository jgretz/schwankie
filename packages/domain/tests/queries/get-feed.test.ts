import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {makeFeed} from '../helpers/factory';
import {getFeed} from '../../src/queries/get-feed';

describe('getFeed', function () {
  setupDb();

  it('should retrieve a feed by id', async function () {
    const created = await makeFeed({name: 'Test Feed'});
    const retrieved = await getFeed(created.id);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.name).toBe('Test Feed');
    expect(retrieved?.id).toBe(created.id);
  });

  it('should return null for non-existent feed', async function () {
    const retrieved = await getFeed('non-existent-id');

    expect(retrieved).toBeNull();
  });
});
