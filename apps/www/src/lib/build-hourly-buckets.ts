import type {StatusBucket} from 'client';

export type HourlyBucket = {hour: Date; count: number};

const HOUR_MS = 60 * 60 * 1000;

function floorToHour(date: Date): Date {
  const floored = new Date(date);
  floored.setMinutes(0, 0, 0);
  return floored;
}

/**
 * Expand a sparse set of hourly counts into a dense, oldest-first series ending at the
 * hour containing `now`, filling absent hours with 0.
 *
 * Slots are walked by subtracting exact hours from a single instant rather than by
 * local-hour arithmetic (`setHours(getHours() - i)`), which skips a slot at a DST
 * spring-forward and emits the same slot twice at a fall-back — the duplicate would also
 * hand the sparkline two bars with the same React key.
 */
export function buildHourlyBuckets(
  buckets: StatusBucket[],
  hours: number,
  now: Date,
): HourlyBucket[] {
  const countByHour = new Map(
    buckets.map((bucket) => [floorToHour(new Date(bucket.hour)).getTime(), bucket.count]),
  );

  const latest = floorToHour(now).getTime();

  return Array.from({length: hours}, (_, slot) => {
    const time = latest - (hours - 1 - slot) * HOUR_MS;
    return {hour: new Date(time), count: countByHour.get(time) ?? 0};
  });
}
