import {describe, expect, it} from 'bun:test';
import {setupDb, store} from '../helpers/setup';
import {makeLink} from '../helpers/factory';
import {mergeTag} from '../../src/commands/merge-tag';

describe('mergeTag', function () {
  setupDb();

  it('should merge alias tag into canonical tag', async function () {
    const link1 = await makeLink({tags: ['alias-tag']});
    const link2 = await makeLink({tags: ['canon-tag']});

    const aliasTagId = link1.tags[0]!.id;
    const canonicalTagId = link2.tags[0]!.id;

    const result = await mergeTag({aliasTagId, canonicalTagId});

    expect(result).toBe(true);

    // Alias tag should be deleted
    const aliasRows = store.tags.filter((t) => t.id === aliasTagId);
    expect(aliasRows).toHaveLength(0);

    // Both links should point to canonical tag
    const linkTagRows = store.linkTags.filter((lt) => lt.tagId === canonicalTagId);
    const linkedIds = linkTagRows.map((r) => r.linkId);
    expect(linkedIds).toContain(link1.id);
    expect(linkedIds).toContain(link2.id);
  });

  it('should return false when alias tag does not exist', async function () {
    const link1 = await makeLink({tags: ['some-tag']});

    const result = await mergeTag({aliasTagId: 999999, canonicalTagId: link1.tags[0]!.id});

    expect(result).toBe(false);
  });

  it('should return false when canonical tag does not exist', async function () {
    const link1 = await makeLink({tags: ['some-tag']});

    const result = await mergeTag({aliasTagId: link1.tags[0]!.id, canonicalTagId: 999999});

    expect(result).toBe(false);
  });

  it('should handle duplicate link-tag associations', async function () {
    const link1 = await makeLink({tags: ['dup-alias', 'dup-canon']});

    const aliasTag = link1.tags.find((t) => t.text === 'dup-alias')!;
    const canonicalTag = link1.tags.find((t) => t.text === 'dup-canon')!;

    const result = await mergeTag({aliasTagId: aliasTag.id, canonicalTagId: canonicalTag.id});

    expect(result).toBe(true);

    const rows = store.linkTags.filter((lt) => lt.linkId === link1.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.tagId).toBe(canonicalTag.id);
  });
});
