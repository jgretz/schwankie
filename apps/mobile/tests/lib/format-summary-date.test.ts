import {afterAll, beforeAll, describe, expect, it} from 'bun:test';
import {formatSummaryDate} from '../../src/lib/format-summary-date';

const LONG_FORM = {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
} as const;

// The UTC-shift regression only reproduces west of Greenwich, so pin a fixed
// offset (Hawaii, UTC-10, no DST) rather than trusting the runner's zone.
// Bun cannot restore the zone by deleting `TZ`, only by assigning one, so fall
// back to the resolved zone when the runner left the variable unset. Otherwise
// the pin leaks into every test file that loads after this one.
const originalTz = process.env.TZ ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

beforeAll(function () {
  process.env.TZ = 'Pacific/Honolulu';
});

afterAll(function () {
  process.env.TZ = originalTz;
});

describe('formatSummaryDate', function () {
  it('should render a well-formed date in the long local form', function () {
    const formatted = formatSummaryDate('2026-03-01');

    expect(formatted).toBe(new Date(2026, 2, 1).toLocaleDateString(undefined, LONG_FORM));
  });

  it('should name the stored day of month rather than the UTC-shifted one', function () {
    // `new Date('2026-03-01')` is UTC midnight, which renders as February 28
    // here. The whole function exists to avoid that.
    const formatted = formatSummaryDate('2026-03-01');

    expect(formatted).toContain(
      new Date(2026, 2, 1).toLocaleDateString(undefined, {day: 'numeric'}),
    );
    expect(formatted).not.toBe(new Date('2026-03-01').toLocaleDateString(undefined, LONG_FORM));
  });

  it('should return a malformed string unchanged', function () {
    expect(formatSummaryDate('not-a-date')).toBe('not-a-date');
  });

  it('should return an empty string unchanged', function () {
    expect(formatSummaryDate('')).toBe('');
  });

  it('should return a zero-month date unchanged', function () {
    expect(formatSummaryDate('2026-00-05')).toBe('2026-00-05');
  });
});
