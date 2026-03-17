import {describe, expect, it} from 'bun:test';
import {setupDb, getDb, trackTag} from '../helpers/setup';
import {makeLink} from '../helpers/factory';
import {tag, linkTag} from 'database';
import {eq} from 'drizzle-orm';
import {mergeTag} from '../../src/commands/merge-tag';

describe('mergeTag', function () {
  setupDb();

  it('should merge alias tag into canonical tag', async function () {
    const aliasName = `test-alias-${Date.now()}`;
    const canonName = `test-canon-${Date.now()}`;
    const link1 = await makeLink({tags: [aliasName]});
    const link2 = await makeLink({tags: [canonName]});

    const aliasTagId = link1.tags[0]!.id;
    const canonicalTagId = link2.tags[0]!.id;

    const result = await mergeTag({aliasTagId, canonicalTagId});

    expect(result).toBe(true);

    const db = getDb();
    const aliasRows = await db.select().from(tag).where(eq(tag.id, aliasTagId));
    expect(aliasRows).toHaveLength(0);

    const linkTagRows = await db.select().from(linkTag).where(eq(linkTag.tagId, canonicalTagId));
    const linkedIds = linkTagRows.map((r) => r.linkId);
    expect(linkedIds).toContain(link1.id);
    expect(linkedIds).toContain(link2.id);
  });

  it('should return false when alias tag does not exist', async function () {
    const canonName = `test-canon2-${Date.now()}`;
    const link1 = await makeLink({tags: [canonName]});

    const result = await mergeTag({aliasTagId: 999999, canonicalTagId: link1.tags[0]!.id});

    expect(result).toBe(false);
  });

  it('should return false when canonical tag does not exist', async function () {
    const aliasName = `test-alias2-${Date.now()}`;
    const link1 = await makeLink({tags: [aliasName]});

    const result = await mergeTag({aliasTagId: link1.tags[0]!.id, canonicalTagId: 999999});

    expect(result).toBe(false);
  });

  it('should handle duplicate link-tag associations', async function () {
    const aliasName = `test-dup-alias-${Date.now()}`;
    const canonName = `test-dup-canon-${Date.now()}`;
    const link1 = await makeLink({tags: [aliasName, canonName]});

    const aliasTag = link1.tags.find((t) => t.text === aliasName)!;
    const canonicalTag = link1.tags.find((t) => t.text === canonName)!;

    const result = await mergeTag({aliasTagId: aliasTag.id, canonicalTagId: canonicalTag.id});

    expect(result).toBe(true);

    const db = getDb();
    const rows = await db.select().from(linkTag).where(eq(linkTag.linkId, link1.id));
    expect(rows).toHaveLength(1);
    expect(rows[0]!.tagId).toBe(canonicalTag.id);
  });
});
