import {describe, expect, it} from 'bun:test';
import {setupDb, getDb} from '../helpers/setup';
import {makeLink} from '../helpers/factory';
import {tag} from 'database';
import {eq, sql} from 'drizzle-orm';
import {listTags} from '../../src/queries/list-tags';

describe('listTags', function () {
  setupDb();

  it('should return tags with counts', async function () {
    const tagName = `test-count-${Date.now()}`;
    await makeLink({title: 'Link A', tags: [tagName]});
    await makeLink({title: 'Link B', tags: [tagName]});

    const result = await listTags({});

    const found = result.tags.find((t) => t.text === tagName);
    expect(found).toBeDefined();
    expect('count' in found! && found.count).toBe(2);
  });

  it('should filter tags needing normalization', async function () {
    const normalizedName = `test-normalized-${Date.now()}`;
    const rawName = `test-raw-${Date.now()}`;
    await makeLink({title: 'Link A', tags: [normalizedName, rawName]});

    const db = getDb();
    await db
      .update(tag)
      .set({normalizedAt: sql`now()`})
      .where(eq(tag.text, normalizedName));

    const result = await listTags({needs_normalization: true});

    const tagTexts = result.tags.map((t) => t.text);
    expect(tagTexts).toContain(rawName);
    expect(tagTexts).not.toContain(normalizedName);
  });

  it('should filter canonical tags', async function () {
    const canonicalName = `test-canonical-${Date.now()}`;
    const notCanonicalName = `test-notcanon-${Date.now()}`;
    await makeLink({title: 'Link A', tags: [canonicalName, notCanonicalName]});

    const db = getDb();
    await db
      .update(tag)
      .set({normalizedAt: sql`now()`})
      .where(eq(tag.text, canonicalName));

    const result = await listTags({canonical: true});

    const tagTexts = result.tags.map((t) => t.text);
    expect(tagTexts).toContain(canonicalName);
    expect(tagTexts).not.toContain(notCanonicalName);
  });
});
