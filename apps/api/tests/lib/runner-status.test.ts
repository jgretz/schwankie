import {describe, it, expect} from 'bun:test';
import {classifyRunner} from '../../src/lib/runner-status';

const NOW = new Date('2026-09-29T12:00:00.000Z').getTime();
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

function beatAgo(ms: number): Date {
  return new Date(NOW - ms);
}

describe('classifyRunner', function () {
  it('should be healthy for a heartbeat just recorded', function () {
    expect(classifyRunner(beatAgo(0), NOW)).toBe('healthy');
  });

  it('should be healthy a full burst gap (45 min) after the last beat', function () {
    expect(classifyRunner(beatAgo(45 * MINUTE), NOW)).toBe('healthy');
  });

  it('should be healthy at exactly 50 min', function () {
    expect(classifyRunner(beatAgo(50 * MINUTE), NOW)).toBe('healthy');
  });

  it('should be stale one second past 50 min', function () {
    expect(classifyRunner(beatAgo(50 * MINUTE + SECOND), NOW)).toBe('stale');
  });

  it('should be stale at exactly 2 h', function () {
    expect(classifyRunner(beatAgo(2 * HOUR), NOW)).toBe('stale');
  });

  it('should be dead one second past 2 h', function () {
    expect(classifyRunner(beatAgo(2 * HOUR + SECOND), NOW)).toBe('dead');
  });

  it('should accept an ISO string heartbeat', function () {
    expect(classifyRunner(beatAgo(46 * MINUTE).toISOString(), NOW)).toBe('healthy');
    expect(classifyRunner(beatAgo(3 * HOUR).toISOString(), NOW)).toBe('dead');
  });
});
