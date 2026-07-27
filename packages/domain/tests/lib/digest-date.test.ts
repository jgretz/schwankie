import {describe, expect, it} from 'bun:test';
import {DIGEST_TZ, digestWindow, localSummaryDate} from '../../src/lib/digest-date';

describe('localSummaryDate', function () {
  it('should label a 7am eastern run with that eastern date', function () {
    // 2026-07-27T11:00:00Z is 07:00 EDT on the 27th.
    expect(localSummaryDate(new Date('2026-07-27T11:00:00Z'))).toBe('2026-07-27');
  });

  it('should still report the previous day just before eastern midnight', function () {
    // 2026-07-28T03:30:00Z is 23:30 EDT on the 27th — a UTC date of the 28th.
    expect(localSummaryDate(new Date('2026-07-28T03:30:00Z'))).toBe('2026-07-27');
  });

  it('should roll over at eastern midnight, not utc midnight', function () {
    // 2026-07-28T04:30:00Z is 00:30 EDT on the 28th.
    expect(localSummaryDate(new Date('2026-07-28T04:30:00Z'))).toBe('2026-07-28');
  });

  it('should apply the standard-time offset in winter', function () {
    // 2026-01-15T12:00:00Z is 07:00 EST on the 15th.
    expect(localSummaryDate(new Date('2026-01-15T12:00:00Z'))).toBe('2026-01-15');
    // 2026-01-15T04:30:00Z is 23:30 EST on the 14th.
    expect(localSummaryDate(new Date('2026-01-15T04:30:00Z'))).toBe('2026-01-14');
  });

  it('should be pinned to the digest zone', function () {
    expect(DIGEST_TZ).toBe('America/New_York');
  });
});

describe('digestWindow', function () {
  it('should span the lookback hours ending at now', function () {
    const now = new Date('2026-07-27T11:00:00Z');

    const {windowStart, windowEnd} = digestWindow(now, 24);

    expect(windowEnd.toISOString()).toBe('2026-07-27T11:00:00.000Z');
    expect(windowStart.toISOString()).toBe('2026-07-26T11:00:00.000Z');
  });

  it('should honour a non-default lookback', function () {
    const now = new Date('2026-07-27T11:00:00Z');

    const {windowStart} = digestWindow(now, 6);

    expect(windowStart.toISOString()).toBe('2026-07-27T05:00:00.000Z');
  });

  it('should not shift across a dst boundary', function () {
    // A pure instant subtraction — the fall-back must not add or drop an hour.
    const now = new Date('2026-11-02T06:00:00Z');

    const {windowStart} = digestWindow(now, 24);

    expect(windowStart.toISOString()).toBe('2026-11-01T06:00:00.000Z');
  });
});
