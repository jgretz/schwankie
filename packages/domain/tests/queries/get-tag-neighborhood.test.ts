import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {makeLink} from '../helpers/factory';
import {getTagNeighborhood} from '../../src/queries/get-tag-neighborhood';
import {store} from '../helpers/mock-db';

describe('getTagNeighborhood', function () {
  setupDb();

  it('returns co-occurring tags ordered by overlap desc', async function () {
    await makeLink({title: 'A', status: 'saved', tags: ['focus', 'python', 'ml']});
    await makeLink({title: 'B', status: 'saved', tags: ['focus', 'python']});
    await makeLink({title: 'C', status: 'saved', tags: ['focus', 'history']});
    await makeLink({title: 'D', status: 'saved', tags: ['unrelated']});

    const focusTag = store.tags.find((t) => t.text === 'focus')!;

    const neighbors = await getTagNeighborhood(focusTag.id, 10);

    const texts = neighbors.map((n) => n.text);
    expect(texts).toContain('python');
    expect(texts).toContain('ml');
    expect(texts).toContain('history');
    expect(texts).not.toContain('focus');
    expect(texts).not.toContain('unrelated');

    const python = neighbors.find((n) => n.text === 'python')!;
    const ml = neighbors.find((n) => n.text === 'ml')!;
    expect(python.count).toBe(2);
    expect(ml.count).toBe(1);
    expect(neighbors.indexOf(python)).toBeLessThan(neighbors.indexOf(ml));
  });

  it('ignores non-saved co-occurrences', async function () {
    await makeLink({title: 'Saved', status: 'saved', tags: ['focus', 'kept']});
    await makeLink({title: 'Queued', status: 'queued', tags: ['focus', 'pending']});

    const focusTag = store.tags.find((t) => t.text === 'focus')!;

    const neighbors = await getTagNeighborhood(focusTag.id);

    const texts = neighbors.map((n) => n.text);
    expect(texts).toContain('kept');
    expect(texts).not.toContain('pending');
  });

  it('returns empty when tag has no saved links', async function () {
    await makeLink({title: 'Queued-only', status: 'queued', tags: ['lonely']});

    const lonelyTag = store.tags.find((t) => t.text === 'lonely')!;

    const neighbors = await getTagNeighborhood(lonelyTag.id);

    expect(neighbors).toHaveLength(0);
  });
});
