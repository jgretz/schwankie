// Neon suspends a compute only after 5 min with zero queries, so every
// idle-time Neon touch from the runner lands on these UTC minutes. Crons and
// the heartbeat both derive from this one constant so they cannot drift apart.
// pg-boss evaluates crons in UTC.
export const BURST_MINUTES = [0, 45] as const;

export const BURST_CRON = `${BURST_MINUTES.join(',')} * * * *`;

const MINUTE_MS = 60_000;

// Strictly after `now`, so a timer that fires exactly on a burst boundary
// schedules the next burst rather than a 0 ms tight loop.
export function msUntilNextBurst(now: Date): number {
  const next = new Date(now.getTime());
  next.setUTCSeconds(0, 0);
  do {
    next.setTime(next.getTime() + MINUTE_MS);
  } while (!(BURST_MINUTES as readonly number[]).includes(next.getUTCMinutes()));
  return next.getTime() - now.getTime();
}
