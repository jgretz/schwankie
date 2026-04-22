import {spawn, type ChildProcess} from 'node:child_process';
import {info, warn, error} from './log';

const INITIAL_BACKOFF_MS = 5_000;
const MAX_BACKOFF_MS = 5 * 60 * 1_000;

interface ChildState {
  process: ChildProcess;
  backoffMs: number;
  respawnTimer: ReturnType<typeof setTimeout> | null;
}

let state: ChildState | null = null;
let onCrash: (() => void) | null = null;

export function setOnCrash(handler: () => void): void {
  onCrash = handler;
}

export function resetBackoff(): void {
  if (state) {
    state.backoffMs = INITIAL_BACKOFF_MS;
  }
}

export function spawnWorker(repoDir: string, env: NodeJS.ProcessEnv): ChildProcess {
  info('Spawning tasks worker');

  const child = spawn('bun', ['run', '--cwd', 'apps/tasks', 'start'], {
    cwd: repoDir,
    env,
    stdio: 'inherit',
  });

  state = {
    process: child,
    backoffMs: state?.backoffMs ?? INITIAL_BACKOFF_MS,
    respawnTimer: null,
  };

  child.on('exit', (code, signal) => {
    if (signal === 'SIGTERM' || signal === 'SIGINT') {
      info('Worker exited from signal', {signal});
      return;
    }

    warn('Worker exited unexpectedly', {code, signal});

    if (!state) return;

    const delay = state.backoffMs;
    state.backoffMs = Math.min(state.backoffMs * 2, MAX_BACKOFF_MS);

    info('Respawning worker after backoff', {delayMs: delay});
    state.respawnTimer = setTimeout(() => {
      if (onCrash) {
        onCrash();
      }
    }, delay);
  });

  return child;
}

export async function stopWorker(timeoutMs: number = 30_000): Promise<void> {
  if (!state) return;

  if (state.respawnTimer) {
    clearTimeout(state.respawnTimer);
    state.respawnTimer = null;
  }

  const child = state.process;

  if (child.exitCode !== null || child.killed) {
    info('Worker already exited');
    state = null;
    return;
  }

  info('Sending SIGTERM to worker', {pid: child.pid});
  child.kill('SIGTERM');

  const exited = await new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => {
      child.removeListener('exit', onExit);
      resolve(false);
    }, timeoutMs);

    function onExit(): void {
      clearTimeout(timer);
      resolve(true);
    }

    child.once('exit', onExit);
  });

  if (!exited) {
    error('Worker did not exit within timeout, sending SIGKILL', {timeoutMs});
    child.kill('SIGKILL');
  }

  state = null;
}
