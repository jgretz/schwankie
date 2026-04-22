import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {makeEmailItem} from '../helpers/factory';
import {listEmailItems} from '../../src/queries/list-email-items';
import {markEmailItemRead} from '../../src/commands/mark-email-item-read';

describe('listEmailItems', function () {
  setupDb();

  it('should list email items with pagination', async function () {
    await makeEmailItem();
    await makeEmailItem();

    const result = await listEmailItems({limit: 10, offset: 0});
    expect(result.items.length).toBeGreaterThanOrEqual(2);
    expect(result.total).toBeGreaterThanOrEqual(2);
    expect(result.hasMore).toBeDefined();
  });

  it('should filter by read status', async function () {
    const item1 = await makeEmailItem();
    const item2 = await makeEmailItem();
    await markEmailItemRead(item2!.id);

    const unread = await listEmailItems({limit: 100, offset: 0, read: false});
    const read = await listEmailItems({limit: 100, offset: 0, read: true});

    const unreadIds = unread.items.map((i) => i.id);
    const readIds = read.items.map((i) => i.id);

    expect(unreadIds).toContain(item1!.id);
    expect(readIds).toContain(item2!.id);
    expect(unreadIds).not.toContain(item2!.id);
    expect(readIds).not.toContain(item1!.id);
  });

  it('should order by importedAt descending', async function () {
    const item1 = await makeEmailItem();
    const item2 = await makeEmailItem();

    const result = await listEmailItems({limit: 100, offset: 0});
    const ids = result.items.map((i) => i.id);

    expect(ids.indexOf(item2!.id)).toBeLessThan(ids.indexOf(item1!.id));
  });

  it('should handle pagination', async function () {
    await makeEmailItem();
    await makeEmailItem();
    await makeEmailItem();

    const page1 = await listEmailItems({limit: 2, offset: 0});
    const page2 = await listEmailItems({limit: 2, offset: 2});

    expect(page1.items).toHaveLength(2);
    expect(page1.hasMore).toBe(true);
    expect(page2.items).toHaveLength(1);
    expect(page2.hasMore).toBe(false);
  });
});
