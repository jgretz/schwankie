import {info, warn} from './log';

export interface HealthConfig {
  url: string;
  initialDelayMs: number;
  retries: number;
  retryIntervalMs: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForHealthy(config: HealthConfig): Promise<boolean> {
  const {url, initialDelayMs, retries, retryIntervalMs} = config;

  info('Waiting for health check', {initialDelayMs});
  await sleep(initialDelayMs);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(5_000),
      });

      if (response.ok) {
        info('Health check passed', {attempt});
        return true;
      }

      warn('Health check returned non-OK', {status: response.status, attempt});
    } catch (err) {
      warn('Health check failed', {
        attempt,
        retries,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    if (attempt < retries) {
      await sleep(retryIntervalMs);
    }
  }

  return false;
}
