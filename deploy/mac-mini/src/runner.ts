import {resolve, dirname} from 'node:path';
import {info, error} from './log';
import {spawnWorker, stopWorker, setOnCrash, resetBackoff} from './child';
import {checkForUpdates, applyUpdate, rollback} from './updater';
import {waitForHealthy, type HealthConfig} from './health';

interface Config {
  remote: string;
  branch: string;
  updateIntervalMs: number;
  drainTimeoutMs: number;
  health: HealthConfig;
}

// Resolve repo root: deploy/mac-mini/src/runner.ts → ../../..
const RUNNER_DIR = dirname(new URL(import.meta.url).pathname);
const REPO_DIR = resolve(RUNNER_DIR, '..', '..', '..');
const CONFIG_PATH = resolve(RUNNER_DIR, '..', 'config.json');

async function loadConfig(): Promise<Config> {
  return Bun.file(CONFIG_PATH).json() as Promise<Config>;
}

function buildEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    NODE_ENV: 'production',
    WORKER_ID: process.env.WORKER_ID ?? `worker-${process.pid}`,
  };
}

let isShuttingDown = false;
let updateTimer: ReturnType<typeof setTimeout> | null = null;

async function performUpdate(config: Config): Promise<void> {
  const updateConfig = {remote: config.remote, branch: config.branch, repoDir: REPO_DIR};

  const {updated, previousSha} = await checkForUpdates(updateConfig);
  if (!updated || !previousSha) return;

  try {
    await applyUpdate(updateConfig);
  } catch (err) {
    error('Update failed, staying on current code', {
      error: err instanceof Error ? err.message : String(err),
    });
    await rollback(updateConfig, previousSha);
    return;
  }

  // Restart worker with new code
  await stopWorker(config.drainTimeoutMs);
  spawnWorker(REPO_DIR, buildEnv());

  const healthy = await waitForHealthy(config.health);

  if (healthy) {
    resetBackoff();
    info('Update deployed successfully');
  } else {
    error('Health check failed after update, rolling back');
    await stopWorker(config.drainTimeoutMs);
    await rollback(updateConfig, previousSha);
    spawnWorker(REPO_DIR, buildEnv());
  }
}

function scheduleUpdateLoop(config: Config): void {
  if (isShuttingDown) return;

  updateTimer = setTimeout(async () => {
    try {
      await performUpdate(config);
    } catch (err) {
      error('Update loop error', {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    scheduleUpdateLoop(config);
  }, config.updateIntervalMs);
}

async function shutdown(config: Config): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  info('Shutting down runner');

  if (updateTimer) {
    clearTimeout(updateTimer);
    updateTimer = null;
  }

  await stopWorker(config.drainTimeoutMs);
  info('Runner exited');
  process.exit(0);
}

async function main(): Promise<void> {
  process.env.NODE_ENV = 'production';

  const config = await loadConfig();

  info('Runner starting', {repoDir: REPO_DIR, branch: config.branch});

  // Set up crash handler — respawn uses the same env
  setOnCrash(() => {
    if (!isShuttingDown) {
      info('Respawning crashed worker');
      spawnWorker(REPO_DIR, buildEnv());
    }
  });

  // Spawn initial worker
  spawnWorker(REPO_DIR, buildEnv());

  // Signal handling — forward to child for graceful drain
  process.on('SIGTERM', () => shutdown(config));
  process.on('SIGINT', () => shutdown(config));

  // Start update polling
  scheduleUpdateLoop(config);

  info('Runner started, polling for updates', {intervalMs: config.updateIntervalMs});
}

main().catch((err) => {
  error('Runner failed to start', {
    error: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
