import {describe, expect, it, mock} from 'bun:test';
import {msUntilNextBurst} from '../../src/lib/burst-schedule';
import {startHeartbeatLoop} from '../../src/lib/heartbeat';

const NOW = new Date('2026-09-29T12:10:00.000Z');

function createFakeTimer() {
  const timers: Array<{fn: () => void; ms: number}> = [];
  return {
    timers,
    setTimer: function (fn: () => void, ms: number) {
      timers.push({fn, ms});
    },
  };
}

// The loop hands setTimer an async callback; awaiting it lets the test observe
// the reschedule that happens in its finally block.
async function fireTimer(timer: {fn: () => void}): Promise<void> {
  await timer.fn();
}

describe('startHeartbeatLoop', function () {
  it('should schedule the first beat for the next burst without sending immediately', function () {
    const send = mock(async function () {});
    const {timers, setTimer} = createFakeTimer();

    startHeartbeatLoop({
      send,
      now: function () {
        return NOW;
      },
      setTimer,
    });

    expect(timers).toHaveLength(1);
    expect(timers[0]?.ms).toBe(msUntilNextBurst(NOW));
    expect(send).toHaveBeenCalledTimes(0);
  });

  it('should send once and schedule the next beat when the timer fires', async function () {
    const send = mock(async function () {});
    const {timers, setTimer} = createFakeTimer();
    const fireAt = new Date('2026-09-29T12:45:00.000Z');
    let current = NOW;

    startHeartbeatLoop({
      send,
      now: function () {
        return current;
      },
      setTimer,
    });
    current = fireAt;
    await fireTimer(timers[0]!);

    expect(send).toHaveBeenCalledTimes(1);
    expect(timers).toHaveLength(2);
    expect(timers[1]?.ms).toBe(msUntilNextBurst(fireAt));
  });

  it('should keep rescheduling without rethrowing when send rejects', async function () {
    const send = mock(async function () {
      throw new Error('api down');
    });
    const {timers, setTimer} = createFakeTimer();
    const originalError = console.error;
    const errorLog = mock(function () {});
    console.error = errorLog;

    try {
      startHeartbeatLoop({
        send,
        now: function () {
          return NOW;
        },
        setTimer,
      });
      await fireTimer(timers[0]!);
      await fireTimer(timers[1]!);
    } finally {
      console.error = originalError;
    }

    expect(send).toHaveBeenCalledTimes(2);
    expect(timers).toHaveLength(3);
    expect(errorLog).toHaveBeenCalledTimes(2);
  });
});
