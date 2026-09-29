export type RunnerHealth = 'healthy' | 'stale' | 'dead';

// The runner beats only at :00/:45 UTC so Neon can suspend between bursts
// (apps/tasks/src/lib/burst-schedule.ts), so a healthy beat can be up to 45 min
// old. Healthy allows 5 min of slack on that; stale covers about two missed beats.
export const HEALTHY_MAX_S = 50 * 60;
export const STALE_MAX_S = 2 * 60 * 60;

export function classifyRunner(
  lastHeartbeatAt: Date | string,
  now: number = Date.now(),
): RunnerHealth {
  const ageS = (now - new Date(lastHeartbeatAt).getTime()) / 1000;
  if (ageS <= HEALTHY_MAX_S) return 'healthy';
  if (ageS <= STALE_MAX_S) return 'stale';
  return 'dead';
}
