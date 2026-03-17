import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {makeLink} from '../helpers/factory';
import {updateLink} from '../../src/commands/update-link';

describe('updateLink', function () {
  setupDb();

  it('should update link fields', async function () {
    const created = await makeLink({title: 'Original'});

    const result = await updateLink(created.id, {title: 'Updated', description: 'New desc'});

    expect(result).not.toBeNull();
    expect(result!.title).toBe('Updated');
    expect(result!.description).toBe('New desc');
  });

  it('should return null for non-existent link', async function () {
    const result = await updateLink(999999, {title: 'Nope'});

    expect(result).toBeNull();
  });

  it('should replace tags when tags array provided', async function () {
    const created = await makeLink({tags: ['old-tag']});

    const result = await updateLink(created.id, {tags: ['new-tag-1', 'new-tag-2']});

    expect(result).not.toBeNull();
    const tagTexts = result!.tags.map((t) => t.text).sort();
    expect(tagTexts).toEqual(['new-tag-1', 'new-tag-2']);
  });

  it('should preserve existing tags when tags not provided', async function () {
    const created = await makeLink({tags: ['keep-tag']});

    const result = await updateLink(created.id, {title: 'Updated'});

    expect(result).not.toBeNull();
    expect(result!.tags).toHaveLength(1);
    expect(result!.tags[0]!.text).toBe('keep-tag');
  });

  it('should clear tags when empty array provided', async function () {
    const created = await makeLink({tags: ['remove-tag']});

    const result = await updateLink(created.id, {tags: []});

    expect(result).not.toBeNull();
    expect(result!.tags).toEqual([]);
  });

  it('should update status', async function () {
    const created = await makeLink();

    const result = await updateLink(created.id, {status: 'archived'});

    expect(result).not.toBeNull();
    expect(result!.status).toBe('archived');
  });
});
