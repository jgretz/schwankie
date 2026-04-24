import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {makeLink} from '../helpers/factory';
import {getRelatedByTags} from '../../src/queries/get-related-by-tags';

describe('getRelatedByTags', function () {
  setupDb();

  it('returns saved links sharing tags, ordered by overlap desc', async function () {
    const source = await makeLink({
      title: 'Source',
      status: 'saved',
      tags: ['ai', 'python', 'ml'],
    });
    const twoOverlap = await makeLink({
      title: 'Two overlap',
      status: 'saved',
      tags: ['ai', 'python', 'history'],
    });
    const oneOverlap = await makeLink({
      title: 'One overlap',
      status: 'saved',
      tags: ['ml', 'cooking'],
    });
    const noOverlap = await makeLink({
      title: 'No overlap',
      status: 'saved',
      tags: ['gardening'],
    });

    const results = await getRelatedByTags(source.id, 10);

    const ids = results.map((r) => r.id);
    expect(ids).toContain(twoOverlap.id);
    expect(ids).toContain(oneOverlap.id);
    expect(ids).not.toContain(noOverlap.id);
    expect(ids).not.toContain(source.id);

    const two = results.find((r) => r.id === twoOverlap.id)!;
    const one = results.find((r) => r.id === oneOverlap.id)!;
    expect(two.overlap).toBe(2);
    expect(one.overlap).toBe(1);
    expect(results.indexOf(two)).toBeLessThan(results.indexOf(one));
  });

  it('excludes non-saved links', async function () {
    const source = await makeLink({
      title: 'Source',
      status: 'saved',
      tags: ['shared'],
    });
    const queued = await makeLink({
      title: 'Queued sibling',
      status: 'queued',
      tags: ['shared'],
    });

    const results = await getRelatedByTags(source.id);

    expect(results.map((r) => r.id)).not.toContain(queued.id);
  });

  it('returns empty when source has no tags', async function () {
    const source = await makeLink({title: 'Tagless', status: 'saved'});
    await makeLink({title: 'Has tag', status: 'saved', tags: ['foo']});

    const results = await getRelatedByTags(source.id);

    expect(results).toHaveLength(0);
  });

  it('respects the limit argument', async function () {
    const source = await makeLink({
      title: 'Source',
      status: 'saved',
      tags: ['shared'],
    });
    for (let i = 0; i < 5; i += 1) {
      await makeLink({title: `Neighbor ${i}`, status: 'saved', tags: ['shared']});
    }

    const results = await getRelatedByTags(source.id, 3);

    expect(results).toHaveLength(3);
  });
});
