/**
 * The zone that defines "today" for a digest. The lookback window itself is an
 * absolute interval and needs no zone; this only decides which calendar date a
 * generated digest is filed under, so a 7am run is labelled with the day the
 * operator would call it.
 */
export const DIGEST_TZ = 'America/New_York';

const DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: DIGEST_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** The local calendar date, as `YYYY-MM-DD` — the `summary_date` of a digest. */
export function localSummaryDate(now: Date): string {
  return DATE_FORMATTER.format(now);
}

/** The absolute window a digest covers: `[now - lookbackHours, now)`. */
export function digestWindow(
  now: Date,
  lookbackHours: number,
): {windowStart: Date; windowEnd: Date} {
  return {
    windowStart: new Date(now.getTime() - lookbackHours * 60 * 60 * 1000),
    windowEnd: now,
  };
}
