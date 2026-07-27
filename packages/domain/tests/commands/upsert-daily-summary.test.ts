import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {makeDailySummary} from '../helpers/factory';
import {upsertDailySummary} from '../../src/commands/upsert-daily-summary';
import {getDailySummary} from '../../src/queries/get-daily-summary';

describe('upsertDailySummary', function () {
  setupDb();

  it('should create a row for a new date', async function () {
    const created = await makeDailySummary({summaryDate: '2026-07-27', itemCount: 12});

    expect(created!.summaryDate).toBe('2026-07-27');
    expect(created!.itemCount).toBe(12);
  });

  it('should overwrite rather than duplicate on a re-run', async function () {
    await makeDailySummary({summaryDate: '2026-07-27', itemCount: 5, notable: 'first pass'});

    await makeDailySummary({summaryDate: '2026-07-27', itemCount: 9, notable: 'second pass'});

    const stored = await getDailySummary('2026-07-27');
    expect(stored!.itemCount).toBe(9);
    expect(stored!.notable).toBe('second pass');
  });

  it('should keep separate rows for separate dates', async function () {
    await makeDailySummary({summaryDate: '2026-07-26'});
    await makeDailySummary({summaryDate: '2026-07-27'});

    expect((await getDailySummary('2026-07-26'))!.summaryDate).toBe('2026-07-26');
    expect((await getDailySummary('2026-07-27'))!.summaryDate).toBe('2026-07-27');
  });

  it('should persist topics as structured data', async function () {
    const topics = [
      {
        rank: 1,
        title: 'Model releases',
        body: 'Two labs shipped. Both target agentic coding.',
        itemCount: 4,
        links: [{url: 'https://example.com/a', title: 'A', source: 'Feed'}],
      },
    ];

    const created = await upsertDailySummary({
      summaryDate: '2026-07-27',
      lookbackHours: 24,
      windowStart: new Date('2026-07-26T11:00:00Z'),
      windowEnd: new Date('2026-07-27T11:00:00Z'),
      itemCount: 120,
      coveredCount: 4,
      notable: 'Model releases dominated.',
      topics,
    });

    expect(created!.topics).toEqual(topics);
  });

  it('should accept an empty window', async function () {
    const created = await makeDailySummary({
      summaryDate: '2026-07-27',
      itemCount: 0,
      topics: [],
      notable: 'A quiet window — nothing came in.',
    });

    expect(created!.topics).toEqual([]);
    expect(created!.itemCount).toBe(0);
  });

  it('should store the window size and the covered count independently', async function () {
    // The whole point of two columns: clustering is lossy, and the gap between
    // what arrived and what the topics account for is the interesting signal.
    const created = await makeDailySummary({
      summaryDate: '2026-07-27',
      itemCount: 504,
      coveredCount: 96,
    });

    expect(created!.itemCount).toBe(504);
    expect(created!.coveredCount).toBe(96);
  });

  it('should overwrite both counts on a re-run', async function () {
    await makeDailySummary({summaryDate: '2026-07-27', itemCount: 504, coveredCount: 96});

    await makeDailySummary({summaryDate: '2026-07-27', itemCount: 310, coveredCount: 71});

    const stored = await getDailySummary('2026-07-27');
    expect(stored!.itemCount).toBe(310);
    expect(stored!.coveredCount).toBe(71);
  });

  it('should default notable to null when omitted', async function () {
    const created = await upsertDailySummary({
      summaryDate: '2026-07-27',
      lookbackHours: 24,
      windowStart: new Date('2026-07-26T11:00:00Z'),
      windowEnd: new Date('2026-07-27T11:00:00Z'),
      itemCount: 0,
      coveredCount: 0,
      topics: [],
    });

    expect(created!.notable).toBeNull();
  });
});
