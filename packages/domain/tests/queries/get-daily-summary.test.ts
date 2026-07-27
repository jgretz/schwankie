import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {makeDailySummary} from '../helpers/factory';
import {getDailySummary} from '../../src/queries/get-daily-summary';
import {listDailySummaryDates} from '../../src/queries/list-daily-summary-dates';

describe('getDailySummary', function () {
  setupDb();

  it('should return the requested date', async function () {
    await makeDailySummary({summaryDate: '2026-07-25', itemCount: 1});
    await makeDailySummary({summaryDate: '2026-07-27', itemCount: 3});

    const result = await getDailySummary('2026-07-25');

    expect(result!.itemCount).toBe(1);
  });

  it('should return the most recent digest when no date is given', async function () {
    await makeDailySummary({summaryDate: '2026-07-25', itemCount: 1});
    await makeDailySummary({summaryDate: '2026-07-27', itemCount: 3});
    await makeDailySummary({summaryDate: '2026-07-26', itemCount: 2});

    const result = await getDailySummary();

    expect(result!.summaryDate).toBe('2026-07-27');
  });

  it('should return null for a date with no digest', async function () {
    await makeDailySummary({summaryDate: '2026-07-27'});

    expect(await getDailySummary('2026-07-01')).toBeNull();
  });

  it('should return null when nothing has been generated yet', async function () {
    expect(await getDailySummary()).toBeNull();
  });
});

describe('listDailySummaryDates', function () {
  setupDb();

  it('should list every date newest first', async function () {
    await makeDailySummary({summaryDate: '2026-07-25'});
    await makeDailySummary({summaryDate: '2026-07-27'});
    await makeDailySummary({summaryDate: '2026-07-26'});

    const dates = await listDailySummaryDates();

    expect(dates).toEqual(['2026-07-27', '2026-07-26', '2026-07-25']);
  });

  it('should not repeat a date that was regenerated', async function () {
    await makeDailySummary({summaryDate: '2026-07-27', itemCount: 1});
    await makeDailySummary({summaryDate: '2026-07-27', itemCount: 2});

    expect(await listDailySummaryDates()).toEqual(['2026-07-27']);
  });

  it('should return an empty list when nothing exists', async function () {
    expect(await listDailySummaryDates()).toEqual([]);
  });
});
