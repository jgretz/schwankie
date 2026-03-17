import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {makeLink} from '../helpers/factory';
import {listLinks} from '../../src/queries/list-links';

describe('listLinks', function () {
  setupDb();

  it('should return links with tags', async function () {
    const tagName = `test-list-${Date.now()}`;
    const created = await makeLink({title: 'List Test', tags: [tagName]});

    const result = await listLinks({limit: 100, offset: 0});

    const found = result.items.find((i) => i.id === created.id);
    expect(found).toBeDefined();
    expect(found!.tags).toHaveLength(1);
    expect(found!.tags[0]!.text).toBe(tagName);
  });

  it('should paginate correctly', async function () {
    // Create 3 links, fetch with limit 2
    await makeLink({title: 'Page A'});
    await makeLink({title: 'Page B'});
    await makeLink({title: 'Page C'});

    const page1 = await listLinks({limit: 2, offset: 0});
    expect(page1.items.length).toBeGreaterThanOrEqual(2);
    expect(page1.hasMore).toBe(true);
  });

  it('should filter by status', async function () {
    const queued = await makeLink({title: 'Queued Link', status: 'queued'});
    await makeLink({title: 'Saved Link', status: 'saved'});

    const result = await listLinks({limit: 100, offset: 0, status: 'queued'});

    const found = result.items.find((i) => i.id === queued.id);
    expect(found).toBeDefined();
    // All results should be queued
    for (const item of result.items) {
      expect(item.status).toBe('queued');
    }
  });

  it('should search by title', async function () {
    const unique = `UniqueSearchTerm${Date.now()}`;
    const created = await makeLink({title: unique});

    const result = await listLinks({limit: 100, offset: 0, q: unique});

    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.id).toBe(created.id);
  });

  it('should filter by tag ids', async function () {
    const tagName = `test-filter-${Date.now()}`;
    const withTag = await makeLink({title: 'With Tag', tags: [tagName]});

    const tagId = withTag.tags[0]!.id;
    const result = await listLinks({limit: 100, offset: 0, tags: String(tagId)});

    const found = result.items.find((i) => i.id === withTag.id);
    expect(found).toBeDefined();
  });
});
