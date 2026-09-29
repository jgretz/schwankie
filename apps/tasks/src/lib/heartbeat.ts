import {msUntilNextBurst} from './burst-schedule';

interface HeartbeatLoopOptions {
  send: () => Promise<void>;
  now?: () => Date;
  setTimer?: (fn: () => void, ms: number) => unknown;
}

export function startHeartbeatLoop({
  send,
  now = function () {
    return new Date();
  },
  setTimer = setTimeout,
}: HeartbeatLoopOptions): void {
  function scheduleNext(): void {
    setTimer(beat, msUntilNextBurst(now()));
  }

  async function beat(): Promise<void> {
    try {
      await send();
    } catch (error) {
      console.error('[heartbeat] Failed:', error);
    } finally {
      scheduleNext();
    }
  }

  scheduleNext();
}
