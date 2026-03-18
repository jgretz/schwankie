import {describe, expect, it} from 'bun:test';
import {setupDb, store} from '../helpers/setup';
import {makeLink} from '../helpers/factory';
import {listTags} from '../../src/queries/list-tags';

describe('listTags', function () {
  setupDb();

  it('should return tags with counts', async function () {
    await makeLink({title: 'Link A', tags: ['count-tag']});
    await makeLink({title: 'Link B', tags: ['count-tag']});

    const result = await listTags({});

    const found = result.tags.find((t) => t.text === 'count-tag');
    expect(found).toBeDefined();
  });

  it('should filter tags needing normalization', async function () {
    await makeLink({title: 'Link A', tags: ['normalized-tag', 'raw-tag']});

    // Mark one tag as normalized
    const normalizedTag = store.tags.find((t) => t.text === 'normalized-tag');
    if (normalizedTag) normalizedTag.normalizedAt = new Date();

    const result = await listTags({needs_normalization: true});

    const tagTexts = result.tags.map((t) => t.text);
    expect(tagTexts).toContain('raw-tag');
    expect(tagTexts).not.toContain('normalized-tag');
  });

  it('should filter tags by link status', async function () {
    await makeLink({title: 'Queued Link', status: 'queued', tags: ['queued-tag']});
    await makeLink({title: 'Saved Link', status: 'saved', tags: ['saved-tag']});

    const result = await listTags({status: 'queued'});

    const tagTexts = result.tags.map((t) => t.text);
    expect(tagTexts).toContain('queued-tag');
    expect(tagTexts).not.toContain('saved-tag');
  });

  it('should filter canonical tags', async function () {
    await makeLink({title: 'Link A', tags: ['canonical-tag', 'not-canonical-tag']});

    // Mark one tag as canonical (normalized)
    const canonicalTag = store.tags.find((t) => t.text === 'canonical-tag');
    if (canonicalTag) canonicalTag.normalizedAt = new Date();

    const result = await listTags({canonical: true});

    const tagTexts = result.tags.map((t) => t.text);
    expect(tagTexts).toContain('canonical-tag');
    expect(tagTexts).not.toContain('not-canonical-tag');
  });
});
