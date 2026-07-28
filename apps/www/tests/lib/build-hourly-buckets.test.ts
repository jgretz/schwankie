import {describe, expect, it} from 'bun:test';
import {buildHourlyBuckets} from '../../src/lib/build-hourly-buckets';

const HOUR_MS = 60 * 60 * 1000;

// Fixed instants so the series is deterministic regardless of when the suite runs.
// Assertions are relative (spacing, ordering, slot index) rather than on absolute
// ISO strings, because the hour floor is taken in local time — absolute expectations
// would fail on a machine whose UTC offset is not a whole number of hours.
const NOW = new Date('2026-07-28T14:37:12.400Z');

function hoursBefore(instant: Date, n: number): string {
  return new Date(instant.getTime() - n * HOUR_MS).toISOString();
}

function gapsBetweenSlots(slots: {hour: Date}[]): number[] {
  const times = slots.map((slot) => slot.hour.getTime());
  return times.reduce<number[]>((gaps, time, i) => {
    const previous = times[i - 1];
    if (previous !== undefined) gaps.push(time - previous);
    return gaps;
  }, []);
}

describe('buildHourlyBuckets', function () {
  describe('series shape', function () {
    it('should return one slot per requested hour', function () {
      const result = buildHourlyBuckets([], 24, NOW);

      expect(result).toHaveLength(24);
    });

    it('should return an empty series when zero hours are requested', function () {
      const result = buildHourlyBuckets([{hour: NOW.toISOString(), count: 9}], 0, NOW);

      expect(result).toEqual([]);
    });

    it('should order slots oldest first', function () {
      const times = buildHourlyBuckets([], 6, NOW).map((slot) => slot.hour.getTime());

      expect(times).toEqual([...times].sort((a, b) => a - b));
    });

    it('should end on the hour containing now', function () {
      const last = buildHourlyBuckets([], 6, NOW).at(-1);
      // NaN when the series came back empty, so both assertions fail rather than pass.
      const elapsed = last ? NOW.getTime() - last.hour.getTime() : Number.NaN;

      expect(elapsed).toBeGreaterThanOrEqual(0);
      expect(elapsed).toBeLessThan(HOUR_MS);
    });

    it('should space slots exactly one hour apart', function () {
      const result = buildHourlyBuckets([], 6, NOW);

      expect(new Set(gapsBetweenSlots(result))).toEqual(new Set([HOUR_MS]));
    });
  });

  describe('counts', function () {
    it('should fill hours with no reported bucket with a zero count', function () {
      const result = buildHourlyBuckets([], 4, NOW);

      expect(result.map((slot) => slot.count)).toEqual([0, 0, 0, 0]);
    });

    it('should place a reported count in the slot for its hour', function () {
      const result = buildHourlyBuckets([{hour: hoursBefore(NOW, 2), count: 7}], 4, NOW);

      expect(result.map((slot) => slot.count)).toEqual([0, 7, 0, 0]);
    });

    it('should floor a bucket timestamp to its hour before matching', function () {
      const midHour = new Date(NOW.getTime() - HOUR_MS + 22 * 60 * 1000).toISOString();

      const result = buildHourlyBuckets([{hour: midHour, count: 5}], 3, NOW);

      expect(result.map((slot) => slot.count)).toEqual([0, 5, 0]);
    });

    it('should ignore buckets that fall outside the requested window', function () {
      const result = buildHourlyBuckets(
        [
          {hour: hoursBefore(NOW, 10), count: 4},
          {hour: hoursBefore(NOW, 1), count: 6},
        ],
        3,
        NOW,
      );

      expect(result.map((slot) => slot.count)).toEqual([0, 6, 0]);
    });
  });

  describe('daylight saving transitions', function () {
    // The regression these guard: local-hour stepping (`setHours(getHours() - i)`) skips
    // a slot at spring-forward and repeats one at fall-back, and a repeat would hand the
    // sparkline two bars carrying the same React key. The windows below straddle the
    // US/Eastern transitions, so they only reproduce that bug on a runner in a
    // DST-observing zone — on a UTC runner they still hold the invariant, which is what
    // the assertions check.

    it('should keep slots unique and one hour apart across a spring-forward', function () {
      // 07:00Z on 2026-03-08 is 02:00 US/Eastern — an hour that does not exist locally.
      const result = buildHourlyBuckets([], 6, new Date('2026-03-08T09:00:00.000Z'));

      expect(new Set(gapsBetweenSlots(result))).toEqual(new Set([HOUR_MS]));
      expect(new Set(result.map((slot) => slot.hour.getTime())).size).toBe(6);
    });

    it('should keep slots unique and one hour apart across a fall-back', function () {
      // 05:00Z–06:00Z on 2026-11-01 is the repeated 01:00 US/Eastern hour.
      const result = buildHourlyBuckets([], 6, new Date('2026-11-01T07:00:00.000Z'));

      expect(new Set(gapsBetweenSlots(result))).toEqual(new Set([HOUR_MS]));
      expect(new Set(result.map((slot) => slot.hour.getTime())).size).toBe(6);
    });
  });
});
