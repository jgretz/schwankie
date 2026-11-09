import {describe, expect, it} from 'bun:test';
import {setupDb, store} from '../helpers/setup';
import {makeDailySummary, makeEmailItem, makeFeed, makeRssItem} from '../helpers/factory';
import {markDailySummaryItemsRead} from '../../src/commands/mark-daily-summary-items-read';

const SUMMARY_DATE = '2026-07-27';
const WINDOW_START = new Date('2026-07-26T11:00:00.000Z');
const WINDOW_END = new Date('2026-07-27T11:00:00.000Z');
const INSIDE_WINDOW = new Date('2026-07-27T00:00:00.000Z');
const BEFORE_WINDOW = new Date(WINDOW_START.getTime() - 1);

async function makeFeedId(): Promise<string> {
  const feed = await makeFeed();
  return feed!.id;
}

async function makeRssItemAt(feedId: string, createdAt: Date): Promise<string> {
  const item = await makeRssItem(feedId, {createdAt});
  return item!.id;
}

async function makeEmailItemAt(importedAt: Date): Promise<string> {
  const item = await makeEmailItem({importedAt});
  return item!.id;
}

function rssRead(id: string): boolean | undefined {
  return store.rssItems.find((row) => row.id === id)?.read;
}

function emailRead(id: string): boolean | undefined {
  return store.emailItems.find((row) => row.id === id)?.read;
}

describe('markDailySummaryItemsRead', function () {
  setupDb();

  it('should return null and change nothing when that date has no digest', async function () {
    await makeDailySummary();
    const rssId = await makeRssItemAt(await makeFeedId(), INSIDE_WINDOW);
    const emailId = await makeEmailItemAt(INSIDE_WINDOW);

    const result = await markDailySummaryItemsRead('2026-07-26');

    expect(result).toBeNull();
    expect(rssRead(rssId)).toBe(false);
    expect(emailRead(emailId)).toBe(false);
  });

  it('should return per-source and total counts', async function () {
    await makeDailySummary();
    const feedId = await makeFeedId();
    await makeRssItemAt(feedId, INSIDE_WINDOW);
    await makeRssItemAt(feedId, INSIDE_WINDOW);
    await makeEmailItemAt(INSIDE_WINDOW);

    const result = await markDailySummaryItemsRead(SUMMARY_DATE);

    expect(result).toEqual({rssCount: 2, emailCount: 1, count: 3});
  });

  it('should use the window of the requested digest', async function () {
    await makeDailySummary();
    await makeDailySummary({
      summaryDate: '2026-07-26',
      windowStart: new Date('2026-07-25T11:00:00.000Z'),
      windowEnd: WINDOW_START,
    });
    const feedId = await makeFeedId();
    const olderRssId = await makeRssItemAt(feedId, BEFORE_WINDOW);
    const newerRssId = await makeRssItemAt(feedId, INSIDE_WINDOW);

    await markDailySummaryItemsRead('2026-07-26');

    expect(rssRead(olderRssId)).toBe(true);
    expect(rssRead(newerRssId)).toBe(false);
  });

  it('should mark an item exactly at the window start for both sources', async function () {
    await makeDailySummary();
    const rssId = await makeRssItemAt(await makeFeedId(), WINDOW_START);
    const emailId = await makeEmailItemAt(WINDOW_START);

    const result = await markDailySummaryItemsRead(SUMMARY_DATE);

    expect(rssRead(rssId)).toBe(true);
    expect(emailRead(emailId)).toBe(true);
    expect(result).toEqual({rssCount: 1, emailCount: 1, count: 2});
  });

  it('should leave an item exactly at the window end unread for both sources', async function () {
    await makeDailySummary();
    const rssId = await makeRssItemAt(await makeFeedId(), WINDOW_END);
    const emailId = await makeEmailItemAt(WINDOW_END);

    const result = await markDailySummaryItemsRead(SUMMARY_DATE);

    expect(rssRead(rssId)).toBe(false);
    expect(emailRead(emailId)).toBe(false);
    expect(result).toEqual({rssCount: 0, emailCount: 0, count: 0});
  });

  it('should leave an item before the window unread for both sources', async function () {
    await makeDailySummary();
    const rssId = await makeRssItemAt(await makeFeedId(), BEFORE_WINDOW);
    const emailId = await makeEmailItemAt(BEFORE_WINDOW);

    const result = await markDailySummaryItemsRead(SUMMARY_DATE);

    expect(rssRead(rssId)).toBe(false);
    expect(emailRead(emailId)).toBe(false);
    expect(result).toEqual({rssCount: 0, emailCount: 0, count: 0});
  });

  it("should leave a disabled feed's in-window item unread", async function () {
    await makeDailySummary();
    const disabledFeedId = await makeFeedId();
    const enabledFeedId = await makeFeedId();
    const disabledItemId = await makeRssItemAt(disabledFeedId, INSIDE_WINDOW);
    const enabledItemId = await makeRssItemAt(enabledFeedId, INSIDE_WINDOW);
    store.feeds.find((row) => row.id === disabledFeedId)!.disabled = true;

    const result = await markDailySummaryItemsRead(SUMMARY_DATE);

    expect(rssRead(disabledItemId)).toBe(false);
    expect(rssRead(enabledItemId)).toBe(true);
    expect(result?.rssCount).toBe(1);
  });

  it('should not count items that are already read', async function () {
    await makeDailySummary();
    const feedId = await makeFeedId();
    const alreadyReadRssId = await makeRssItemAt(feedId, INSIDE_WINDOW);
    await makeRssItemAt(feedId, INSIDE_WINDOW);
    const alreadyReadEmailId = await makeEmailItemAt(INSIDE_WINDOW);
    await makeEmailItemAt(INSIDE_WINDOW);
    store.rssItems.find((row) => row.id === alreadyReadRssId)!.read = true;
    store.emailItems.find((row) => row.id === alreadyReadEmailId)!.read = true;

    const result = await markDailySummaryItemsRead(SUMMARY_DATE);

    expect(result).toEqual({rssCount: 1, emailCount: 1, count: 2});
  });

  it('should return zeros on a second call', async function () {
    await makeDailySummary();
    await makeRssItemAt(await makeFeedId(), INSIDE_WINDOW);
    await makeEmailItemAt(INSIDE_WINDOW);
    await markDailySummaryItemsRead(SUMMARY_DATE);

    const second = await markDailySummaryItemsRead(SUMMARY_DATE);

    expect(second).toEqual({rssCount: 0, emailCount: 0, count: 0});
  });

  it('should leave promoted and openedAt unchanged', async function () {
    await makeDailySummary();
    const openedAt = new Date('2026-07-27T02:00:00.000Z');
    const rssId = await makeRssItemAt(await makeFeedId(), INSIDE_WINDOW);
    const emailId = await makeEmailItemAt(INSIDE_WINDOW);
    Object.assign(store.rssItems.find((row) => row.id === rssId)!, {promoted: true, openedAt});
    Object.assign(store.emailItems.find((row) => row.id === emailId)!, {promoted: true, openedAt});

    await markDailySummaryItemsRead(SUMMARY_DATE);

    expect(store.rssItems.find((row) => row.id === rssId)).toMatchObject({
      read: true,
      promoted: true,
      openedAt,
    });
    expect(store.emailItems.find((row) => row.id === emailId)).toMatchObject({
      read: true,
      promoted: true,
      openedAt,
    });
  });
});
