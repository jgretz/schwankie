export type RunnerHealth = 'healthy' | 'stale' | 'dead';

export const HEALTHY_MAX_S = 120;
export const STALE_MAX_S = 600;

export function classifyRunner(
  lastHeartbeatAt: Date | string,
  now: number = Date.now(),
): RunnerHealth {
  const ageS = (now - new Date(lastHeartbeatAt).getTime()) / 1000;
  if (ageS <= HEALTHY_MAX_S) return 'healthy';
  if (ageS <= STALE_MAX_S) return 'stale';
  return 'dead';
}
