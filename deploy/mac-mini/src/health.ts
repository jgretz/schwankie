import {hostname} from 'node:os';
import {info, warn} from './log';

export interface HealthSettings {
  initialDelayMs: number;
  retries: number;
  retryIntervalMs: number;
  staleThresholdMs?: number;
}

export interface WaitForHeartbeatOptions extends HealthSettings {
  apiUrl: string;
  apiKey: string;
  childPid: number;
  spawnTime: Date;
}

interface RunnerRow {
  workerId: string;
  hostname: string;
  pid: number;
  lastHeartbeatAt: string;
  startedAt: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForHeartbeat(opts: WaitForHeartbeatOptions): Promise<boolean> {
  const stale = opts.staleThresholdMs ?? 120_000;
  const host = hostname();

  info('Waiting for runner heartbeat', {
    initialDelayMs: opts.initialDelayMs,
    childPid: opts.childPid,
  });
  await sleep(opts.initialDelayMs);

  for (let attempt = 1; attempt <= opts.retries; attempt++) {
    try {
      const response = await fetch(`${opts.apiUrl}/api/runners`, {
        headers: {Authorization: `Bearer ${opts.apiKey}`},
        signal: AbortSignal.timeout(5_000),
      });

      if (response.ok) {
        const rows = (await response.json()) as RunnerRow[];
        const me = rows.find((r) => r.hostname === host && r.pid === opts.childPid);

        if (me) {
          const ageMs = Date.now() - new Date(me.lastHeartbeatAt).getTime();
          const fresh = ageMs <= stale;
          const isMine = new Date(me.startedAt).getTime() >= opts.spawnTime.getTime();

          if (fresh && isMine) {
            info('Runner heartbeat detected', {
              attempt,
              workerId: me.workerId,
              ageMs,
            });
            return true;
          }

          warn('Runner row found but not yet fresh/current', {
            attempt,
            ageMs,
            fresh,
            isMine,
          });
        } else {
          warn('Runner row not found yet', {attempt, host, pid: opts.childPid});
        }
      } else {
        warn('Runner list request returned non-OK', {status: response.status, attempt});
      }
    } catch (err) {
      warn('Runner heartbeat check failed', {
        attempt,
        retries: opts.retries,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    if (attempt < opts.retries) {
      await sleep(opts.retryIntervalMs);
    }
  }

  return false;
}
