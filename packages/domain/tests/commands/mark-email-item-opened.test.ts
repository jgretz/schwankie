import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {makeEmailItem} from '../helpers/factory';
import {markEmailItemOpened} from '../../src/commands/mark-email-item-opened';

describe('markEmailItemOpened', function () {
  setupDb();

  it('should record the open time when an item is opened', async function () {
    const item = await makeEmailItem();
    const before = Date.now();

    const updated = await markEmailItemOpened(item!.id);

    expect(updated!.openedAt!.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('should mark the item read when it is opened', async function () {
    const item = await makeEmailItem();

    const updated = await markEmailItemOpened(item!.id);

    expect(updated!.read).toBe(true);
  });

  it('should leave promoted unchanged when an item is opened', async function () {
    const item = await makeEmailItem();

    const updated = await markEmailItemOpened(item!.id);

    expect(updated!.promoted).toBe(false);
  });

  it('should return null for non-existent item', async function () {
    const result = await markEmailItemOpened('00000000-0000-0000-0000-000000000000');
    expect(result).toBeNull();
  });
});
