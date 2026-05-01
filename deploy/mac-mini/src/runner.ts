import {resolve, dirname} from 'node:path';
import {info, error} from './log';
import {spawnWorker, stopWorker, setOnCrash, resetBackoff} from './child';
import {checkForUpdates, applyUpdate, rollback} from './updater';
import {waitForHeartbeat, type HealthSettings} from './health';

interface Config {
  remote: string;
  branch: string;
  updateIntervalMs: number;
  drainTimeoutMs: number;
  health: HealthSettings;
}

const RUNNER_DIR = dirname(new URL(import.meta.url).pathname);
const REPO_DIR = resolve(RUNNER_DIR, '..', '..', '..');
const CONFIG_PATH = resolve(RUNNER_DIR, '..', 'config.json');

async function loadConfig(): Promise<Config> {
  return Bun.file(CONFIG_PATH).json() as Promise<Config>;
}

function readApiCreds(): {apiUrl: string; apiKey: string} {
  const apiUrl = process.env.API_URL;
  const apiKey = process.env.API_KEY;
  if (!apiUrl || !apiKey) {
    throw new Error('API_URL and API_KEY must be set in env for the runner');
  }
  return {apiUrl, apiKey};
}

function buildEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    NODE_ENV: 'production',
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
    error('Update failed, rolling back to previous state', {
      error: err instanceof Error ? err.message : String(err),
    });
    await rollback(updateConfig, previousSha);
    return;
  }

  await stopWorker(config.drainTimeoutMs);
  const child = spawnWorker(REPO_DIR, buildEnv());
  const spawnTime = new Date();

  if (typeof child.pid !== 'number') {
    error('Spawned worker has no pid; rolling back');
    await stopWorker(config.drainTimeoutMs);
    await rollback(updateConfig, previousSha);
    spawnWorker(REPO_DIR, buildEnv());
    return;
  }

  const {apiUrl, apiKey} = readApiCreds();
  const healthy = await waitForHeartbeat({
    apiUrl,
    apiKey,
    childPid: child.pid,
    spawnTime,
    ...config.health,
  });

  if (healthy) {
    resetBackoff();
    info('Update deployed successfully');
  } else {
    error('Heartbeat check failed after update, rolling back');
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
  readApiCreds(); // fail fast if env missing

  info('Runner starting', {repoDir: REPO_DIR, branch: config.branch});

  setOnCrash(() => {
    if (!isShuttingDown) {
      info('Respawning crashed worker');
      spawnWorker(REPO_DIR, buildEnv());
    }
  });

  spawnWorker(REPO_DIR, buildEnv());

  process.on('SIGTERM', () => shutdown(config));
  process.on('SIGINT', () => shutdown(config));

  scheduleUpdateLoop(config);

  info('Runner started, polling for updates', {intervalMs: config.updateIntervalMs});
}

main().catch((err) => {
  error('Runner failed to start', {
    error: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
