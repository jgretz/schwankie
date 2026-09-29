import {describe, expect, it} from 'bun:test';
import {jobDefinitions} from '../src/job-definitions';
import {BURST_CRON, BURST_MINUTES} from '../src/lib/burst-schedule';

// Off-burst crons that reach Neon only when there is work: the hinted
// work-request poll is answered from API memory while idle.
const NEON_FREE_WHEN_IDLE = new Set(['process-work-requests']);

function minuteFieldIsOnBurst(schedule: string): boolean {
  const minuteField = schedule.trim().split(/\s+/)[0] ?? '';
  return minuteField.split(',').every(function (part) {
    return /^\d+$/.test(part) && (BURST_MINUTES as readonly number[]).includes(Number(part));
  });
}

function findDefinition(queue: string) {
  const definition = jobDefinitions.find(function (d) {
    return d.queue === queue;
  });
  if (!definition) throw new Error(`No job definition for queue ${queue}`);
  return definition;
}

const scheduled = jobDefinitions.filter(function (d) {
  return d.schedule !== '';
});

describe('jobDefinitions idle cadence', function () {
  it('should only schedule crons on burst minutes, apart from the Neon-free allowlist', function () {
    const offBurst = scheduled
      .filter(function (d) {
        return !NEON_FREE_WHEN_IDLE.has(d.queue) && !minuteFieldIsOnBurst(d.schedule);
      })
      .map(function (d) {
        return `${d.queue} (${d.schedule})`;
      });

    expect(offBurst).toEqual([]);
  });

  it('should still need every allowlist exemption', function () {
    for (const queue of NEON_FREE_WHEN_IDLE) {
      const definition = findDefinition(queue);

      expect(definition.schedule).not.toBe('');
      expect(minuteFieldIsOnBurst(definition.schedule)).toBe(false);
    }
  });

  it('should reject minute fields that are not plain burst integers', function () {
    expect(minuteFieldIsOnBurst('*/5 * * * *')).toBe(false);
    expect(minuteFieldIsOnBurst('0-45 * * * *')).toBe(false);
    expect(minuteFieldIsOnBurst('0,30 * * * *')).toBe(false);
    expect(minuteFieldIsOnBurst('* * * * *')).toBe(false);
    expect(minuteFieldIsOnBurst('0 4 * * *')).toBe(true);
  });

  it('should sweep work requests on the burst clock and at boot', function () {
    const sweep = findDefinition('sweep-work-requests');

    expect(sweep.schedule).toBe(BURST_CRON);
    expect(sweep.runOnBoot).toBe(true);
  });

  it('should not run the hinted work-request poll at boot', function () {
    expect(findDefinition('process-work-requests').runOnBoot).toBeUndefined();
  });

  it('should run every schedule-* queue on the burst cron', function () {
    const schedulers = jobDefinitions.filter(function (d) {
      return d.queue.startsWith('schedule-');
    });

    expect(schedulers).toHaveLength(6);
    for (const definition of schedulers) {
      expect(definition.schedule).toBe(BURST_CRON);
    }
  });
});
