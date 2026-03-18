import {describe, expect, it} from 'bun:test';
import {setupDb, store} from '../helpers/setup';
import {makeLink} from '../helpers/factory';
import {deleteTag} from '../../src/commands/delete-tag';

describe('deleteTag', function () {
  setupDb();

  it('should delete an existing tag', async function () {
    const link = await makeLink({tags: ['doomed-tag']});
    const tagId = link.tags[0]!.id;

    const result = await deleteTag(tagId);

    expect(result).toBe(true);
    const remaining = store.tags.filter((t) => t.id === tagId);
    expect(remaining).toHaveLength(0);
  });

  it('should return false for non-existent tag', async function () {
    const result = await deleteTag(999999);

    expect(result).toBe(false);
  });
});
