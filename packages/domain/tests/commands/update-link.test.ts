import {describe, expect, it} from 'bun:test';
import {setupDb, trackTag} from '../helpers/setup';
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
    const created = await makeLink({tags: [`test-old-${Date.now()}`]});

    const newTag1 = `test-new1-${Date.now()}`;
    const newTag2 = `test-new2-${Date.now()}`;
    const result = await updateLink(created.id, {tags: [newTag1, newTag2]});

    expect(result).not.toBeNull();
    for (const t of result!.tags) trackTag(t.id);
    const tagTexts = result!.tags.map((t) => t.text).sort();
    expect(tagTexts).toEqual([newTag1, newTag2].sort());
  });

  it('should preserve existing tags when tags not provided', async function () {
    const tagName = `test-keep-${Date.now()}`;
    const created = await makeLink({tags: [tagName]});

    const result = await updateLink(created.id, {title: 'Updated'});

    expect(result).not.toBeNull();
    expect(result!.tags).toHaveLength(1);
    expect(result!.tags[0]!.text).toBe(tagName);
  });

  it('should clear tags when empty array provided', async function () {
    const created = await makeLink({tags: [`test-remove-${Date.now()}`]});

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
