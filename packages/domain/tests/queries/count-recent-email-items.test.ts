import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {makeEmailItem} from '../helpers/factory';
import {countRecentEmailItems} from '../../src/queries/count-recent-email-items';

describe('countRecentEmailItems', function () {
  setupDb();

  it('should count email items from the last 7 days', async function () {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const eightDaysAgo = now - 8 * 24 * 60 * 60 * 1000;

    await makeEmailItem({importedAt: new Date(now)});
    await makeEmailItem({importedAt: new Date(sevenDaysAgo + 1000)});
    await makeEmailItem({importedAt: new Date(eightDaysAgo)});

    const count = await countRecentEmailItems(7);

    expect(count).toBe(2);
  });

  it('should return 0 when no recent items exist', async function () {
    const count = await countRecentEmailItems(7);
    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it('should respect the days parameter', async function () {
    const now = Date.now();
    const oneDayAgo = now - 1 * 24 * 60 * 60 * 1000;
    const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;

    await makeEmailItem({importedAt: new Date(now)});
    await makeEmailItem({importedAt: new Date(oneDayAgo)});
    await makeEmailItem({importedAt: new Date(threeDaysAgo)});

    const countLast2Days = await countRecentEmailItems(2);
    const countLast7Days = await countRecentEmailItems(7);

    expect(countLast2Days).toBe(2);
    expect(countLast7Days).toBe(3);
  });
});
