import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {makeLink} from '../helpers/factory';
import {listLinks} from '../../src/queries/list-links';

describe('listLinks', function () {
  setupDb();

  it('should return links with tags', async function () {
    const created = await makeLink({title: 'List Test', tags: ['list-tag']});

    const result = await listLinks({limit: 100, offset: 0});

    const found = result.items.find((i) => i.id === created.id);
    expect(found).toBeDefined();
    expect(found!.tags).toHaveLength(1);
    expect(found!.tags[0]!.text).toBe('list-tag');
  });

  it('should paginate correctly', async function () {
    await makeLink({title: 'Page A'});
    await makeLink({title: 'Page B'});
    await makeLink({title: 'Page C'});

    const page1 = await listLinks({limit: 2, offset: 0});
    expect(page1.items).toHaveLength(2);
    expect(page1.hasMore).toBe(true);
  });

  it('should filter by status', async function () {
    await makeLink({title: 'Queued Link', status: 'queued'});
    await makeLink({title: 'Saved Link', status: 'saved'});

    const result = await listLinks({limit: 100, offset: 0, status: 'queued'});

    for (const item of result.items) {
      expect(item.status).toBe('queued');
    }
    expect(result.items.length).toBeGreaterThanOrEqual(1);
  });

  it('should search by title', async function () {
    const unique = `UniqueSearchTerm${Date.now()}`;
    await makeLink({title: unique});

    const result = await listLinks({limit: 100, offset: 0, q: unique});

    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.title).toBe(unique);
  });

  it('should filter by tag ids', async function () {
    const withTag = await makeLink({title: 'With Tag', tags: ['filter-tag']});

    const tagId = withTag.tags[0]!.id;
    const result = await listLinks({limit: 100, offset: 0, tags: String(tagId)});

    const found = result.items.find((i) => i.id === withTag.id);
    expect(found).toBeDefined();
  });

  it('should return only links matching provided ids', async function () {
    const link1 = await makeLink({title: 'Link 1'});
    const link2 = await makeLink({title: 'Link 2'});
    const link3 = await makeLink({title: 'Link 3'});

    const result = await listLinks({limit: 100, offset: 0, ids: `${link1.id},${link2.id}`});

    expect(result.items).toHaveLength(2);
    const ids = result.items.map((i) => i.id);
    expect(ids).toContain(link1.id);
    expect(ids).toContain(link2.id);
    expect(ids).not.toContain(link3.id);
  });

  it("should return empty when ids don't match any links", async function () {
    const result = await listLinks({limit: 100, offset: 0, ids: '999999,999998'});

    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should combine ids filter with other filters (status)', async function () {
    const savedLink = await makeLink({title: 'Saved', status: 'saved'});
    const queuedLink = await makeLink({title: 'Queued', status: 'queued'});
    const anotherSavedLink = await makeLink({title: 'Another Saved', status: 'saved'});

    const result = await listLinks({
      limit: 100,
      offset: 0,
      ids: `${savedLink.id},${queuedLink.id},${anotherSavedLink.id}`,
      status: 'saved',
    });

    expect(result.items).toHaveLength(2);
    for (const item of result.items) {
      expect(item.status).toBe('saved');
      expect([savedLink.id, anotherSavedLink.id]).toContain(item.id);
    }
  });
});
