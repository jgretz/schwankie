import {describe, expect, it} from 'bun:test';
import {setupDb, store} from '../helpers/setup';
import {makeLink} from '../helpers/factory';
import {renameTag} from '../../src/commands/rename-tag';

describe('renameTag', function () {
  setupDb();

  it('should rename an existing tag', async function () {
    const link = await makeLink({tags: ['old-name']});
    const tagId = link.tags[0]!.id;

    const result = await renameTag({id: tagId, text: 'New Name'});

    expect(result).toBe(true);
    const updated = store.tags.find((t) => t.id === tagId);
    expect(updated?.text).toBe('new-name');
  });

  it('should normalize the tag text', async function () {
    const link = await makeLink({tags: ['original']});
    const tagId = link.tags[0]!.id;

    const result = await renameTag({id: tagId, text: '  Spaced  Out  '});

    expect(result).toBe(true);
    const updated = store.tags.find((t) => t.id === tagId);
    expect(updated?.text).toBe('spaced-out');
  });

  it('should return false for non-existent tag', async function () {
    const result = await renameTag({id: 999999, text: 'anything'});

    expect(result).toBe(false);
  });

  it('should return false when normalized text is empty', async function () {
    const link = await makeLink({tags: ['valid-tag']});
    const tagId = link.tags[0]!.id;

    const result = await renameTag({id: tagId, text: '   '});

    expect(result).toBe(false);
  });
});
