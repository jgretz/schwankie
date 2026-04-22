import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {makeEmailItem} from '../helpers/factory';
import {markEmailItemRead} from '../../src/commands/mark-email-item-read';

describe('markEmailItemRead', function () {
  setupDb();

  it('should mark email item as read', async function () {
    const item = await makeEmailItem();
    expect(item!.read).toBe(false);

    const updated = await markEmailItemRead(item!.id);
    expect(updated).not.toBeNull();
    expect(updated!.read).toBe(true);
    expect(updated!.clicked).toBe(false);
  });

  it('should mark email item as read and clicked', async function () {
    const item = await makeEmailItem();
    const updated = await markEmailItemRead(item!.id, {clicked: true});

    expect(updated!.read).toBe(true);
    expect(updated!.clicked).toBe(true);
  });

  it('should return null for non-existent item', async function () {
    const result = await markEmailItemRead('00000000-0000-0000-0000-000000000000');
    expect(result).toBeNull();
  });
});
