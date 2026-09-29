import {describe, expect, it} from 'bun:test';
import {BURST_CRON, BURST_MINUTES, msUntilNextBurst} from '../../src/lib/burst-schedule';

const SECOND = 1000;
const MINUTE = 60 * SECOND;

describe('msUntilNextBurst', function () {
  it('should skip to the next burst when now is exactly on a burst boundary', function () {
    expect(msUntilNextBurst(new Date('2026-09-29T12:00:00.000Z'))).toBe(45 * MINUTE);
  });

  it('should return one second when the burst is one second away', function () {
    expect(msUntilNextBurst(new Date('2026-09-29T12:44:59.000Z'))).toBe(SECOND);
  });

  it('should count from a sub-second offset past a burst to the next burst', function () {
    expect(msUntilNextBurst(new Date('2026-09-29T12:45:00.500Z'))).toBe(
      14 * MINUTE + 59.5 * SECOND,
    );
  });

  it('should roll over midnight to the :00 burst of the next day', function () {
    expect(msUntilNextBurst(new Date('2026-09-29T23:50:00.000Z'))).toBe(10 * MINUTE);
  });

  it('should always land on a UTC burst minute with zero seconds, never 0 ms away', function () {
    const start = new Date('2026-09-29T00:00:00.000Z').getTime();
    for (let offset = 0; offset < 2 * 60 * MINUTE; offset += 7 * SECOND + 333) {
      const now = new Date(start + offset);
      const delay = msUntilNextBurst(now);
      const fire = new Date(now.getTime() + delay);

      expect(delay).toBeGreaterThan(0);
      expect(delay).toBeLessThanOrEqual(45 * MINUTE);
      expect(BURST_MINUTES as readonly number[]).toContain(fire.getUTCMinutes());
      expect(fire.getUTCSeconds()).toBe(0);
      expect(fire.getUTCMilliseconds()).toBe(0);
    }
  });
});

describe('BURST_CRON', function () {
  it('should fire at minutes 0 and 45 of every hour', function () {
    expect(BURST_CRON).toBe('0,45 * * * *');
  });
});
