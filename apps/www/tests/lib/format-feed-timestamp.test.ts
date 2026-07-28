import {describe, expect, it} from 'bun:test';
import {formatFeedTimestamp} from '../../src/lib/format-feed-timestamp';

const EM_DASH = '—';

describe('formatFeedTimestamp', function () {
  // Output is locale- and timezone-dependent, so assert on shape, not an exact string.
  it('should render a parseable timestamp', function () {
    const result = formatFeedTimestamp('2026-03-04T15:07:00.000Z');

    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toBe(EM_DASH);
    expect(result).not.toBe('Invalid Date');
  });

  it('should return an em-dash for null', function () {
    expect(formatFeedTimestamp(null)).toBe(EM_DASH);
  });

  it('should return an em-dash for an empty string', function () {
    expect(formatFeedTimestamp('')).toBe(EM_DASH);
  });

  it('should return an em-dash for an unparseable date', function () {
    expect(formatFeedTimestamp('not-a-date')).toBe(EM_DASH);
  });

  it('should return the same output for the same input', function () {
    const iso = '2026-03-04T15:07:00.000Z';

    expect(formatFeedTimestamp(iso)).toBe(formatFeedTimestamp(iso));
  });
});
