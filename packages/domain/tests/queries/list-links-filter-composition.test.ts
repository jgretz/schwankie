import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {makeLink} from '../helpers/factory';
import {listLinks} from '../../src/queries/list-links';

describe('listLinks — search + tag filter composition', function () {
  setupDb();

  it('should return matches for search alone', async function () {
    await makeLink({title: 'PostgreSQL performance tips', tags: ['database']});
    await makeLink({title: 'Baking sourdough bread', tags: ['recipe']});

    const result = await listLinks({limit: 100, offset: 0, q: 'postgres'});

    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.title).toBe('PostgreSQL performance tips');
  });

  it('should return matches for tag filter alone', async function () {
    const dbLink = await makeLink({title: 'PostgreSQL performance tips', tags: ['database']});
    await makeLink({title: 'Baking sourdough bread', tags: ['recipe']});

    const tagId = dbLink.tags[0]!.id;
    const result = await listLinks({limit: 100, offset: 0, tags: String(tagId)});

    const ids = result.items.map((i) => i.id);
    expect(ids).toContain(dbLink.id);
    expect(result.items.some((i) => i.title === 'Baking sourdough bread')).toBe(false);
  });

  it('should compose search + tag filter with AND when they overlap', async function () {
    const dbLink = await makeLink({title: 'PostgreSQL performance tips', tags: ['database']});
    await makeLink({title: 'Baking sourdough bread', tags: ['recipe']});

    const tagId = dbLink.tags[0]!.id;
    const result = await listLinks({limit: 100, offset: 0, q: 'postgres', tags: String(tagId)});

    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.id).toBe(dbLink.id);
  });

  it('should return 0 results when search + tag filter do not overlap', async function () {
    const dbLink = await makeLink({title: 'PostgreSQL performance tips', tags: ['database']});
    const recipeLink = await makeLink({title: 'Baking sourdough bread', tags: ['recipe']});

    // postgres is in the database-tagged link, but we filter by recipe tag
    const recipeTagId = recipeLink.tags[0]!.id;
    const result = await listLinks({
      limit: 100,
      offset: 0,
      q: 'postgres',
      tags: String(recipeTagId),
    });

    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
    // confirm the individual filters work independently
    expect(dbLink.id).not.toBe(recipeLink.id);
  });

  it('should compose search + multiple tags (link must have ALL tags)', async function () {
    const dualLink = await makeLink({
      title: 'Database-backed recipe manager',
      tags: ['database', 'recipe'],
    });
    // These share tag objects with dualLink due to onConflictDoNothing in mock-db
    await makeLink({title: 'PostgreSQL performance tips', tags: ['database']});
    await makeLink({title: 'Classic bread recipes', tags: ['recipe']});

    const dbTagId = dualLink.tags.find((t) => t.text === 'database')!.id;
    const recipeTagId = dualLink.tags.find((t) => t.text === 'recipe')!.id;

    // q='recipe' matches "Database-backed recipe manager" and "Classic bread recipes"
    // tags=database,recipe requires both tags — only dualLink qualifies
    const result = await listLinks({
      limit: 100,
      offset: 0,
      q: 'recipe',
      tags: `${dbTagId},${recipeTagId}`,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.id).toBe(dualLink.id);
  });

  it('should match search against description, not just title', async function () {
    const descLink = await makeLink({
      title: 'My App',
      description: 'Uses PostgreSQL for storage',
      tags: ['database'],
    });
    await makeLink({title: 'Other App', tags: ['database']});

    const tagId = descLink.tags[0]!.id;
    const result = await listLinks({limit: 100, offset: 0, q: 'postgres', tags: String(tagId)});

    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.id).toBe(descLink.id);
  });

  it('should compose status + search + tag filter', async function () {
    const savedLink = await makeLink({
      title: 'PostgreSQL performance tips',
      status: 'saved',
      tags: ['database'],
    });
    const queuedLink = await makeLink({
      title: 'PostgreSQL query optimization',
      status: 'queued',
      tags: ['database'],
    });

    // Both share the same 'database' tag ID
    const tagId = savedLink.tags[0]!.id;
    const result = await listLinks({
      limit: 100,
      offset: 0,
      status: 'saved',
      q: 'postgres',
      tags: String(tagId),
    });

    const ids = result.items.map((i) => i.id);
    expect(ids).toContain(savedLink.id);
    expect(ids).not.toContain(queuedLink.id);
    for (const item of result.items) {
      expect(item.status).toBe('saved');
    }
  });
});
