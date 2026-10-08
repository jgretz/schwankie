import {describe, expect, it} from 'bun:test';
import {
  DEFAULT_HISTORY_DAYS,
  formatHistoryMeta,
  HISTORY_RANGES,
  parseHistoryDays,
} from '../../src/lib/history-search';

describe('parseHistoryDays', function () {
  it('should accept each supported window as a number or a string', function () {
    for (const {days} of HISTORY_RANGES) {
      expect(parseHistoryDays(days)).toBe(days);
      expect(parseHistoryDays(String(days))).toBe(days);
    }
  });

  it('should fall back to the default for anything else', function () {
    for (const value of [undefined, null, 14, '14', 'abc', '', {}, 30.5]) {
      expect(parseHistoryDays(value)).toBe(DEFAULT_HISTORY_DAYS);
    }
    expect(DEFAULT_HISTORY_DAYS).toBe(30);
  });
});

describe('HISTORY_RANGES', function () {
  it('should offer the week, month and quarter windows in order', function () {
    expect(HISTORY_RANGES.map((range) => range.days)).toEqual([7, 30, 90]);
  });
});

describe('formatHistoryMeta', function () {
  it('should join the source and the ingest date', function () {
    const meta = formatHistoryMeta({source: 'TechCrunch', ingestedAt: '2026-10-05T12:00:00.000Z'});

    expect(meta).toBe('TechCrunch · Oct 5, 2026');
  });
});
