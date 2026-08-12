import {describe, expect, it} from 'bun:test';
import {resolveAdjacentDates} from '../../src/lib/resolve-adjacent-dates';

// Newest-first, as the API returns them.
const DATES = ['2026-03-03', '2026-03-02', '2026-03-01'];

describe('resolveAdjacentDates', function () {
  it('should return no neighbours when the date list is empty', function () {
    expect(resolveAdjacentDates([], '2026-03-02')).toEqual({
      previousDate: undefined,
      nextDate: undefined,
    });
  });

  it('should return no neighbours when the date list is undefined', function () {
    expect(resolveAdjacentDates(undefined, '2026-03-02')).toEqual({
      previousDate: undefined,
      nextDate: undefined,
    });
  });

  it('should return no neighbours when the active date is undefined', function () {
    expect(resolveAdjacentDates(DATES, undefined)).toEqual({
      previousDate: undefined,
      nextDate: undefined,
    });
  });

  it('should return no neighbours when the active date is absent from the list', function () {
    expect(resolveAdjacentDates(DATES, '2026-02-14')).toEqual({
      previousDate: undefined,
      nextDate: undefined,
    });
  });

  it('should return only an older neighbour for the newest entry', function () {
    expect(resolveAdjacentDates(DATES, '2026-03-03')).toEqual({
      previousDate: '2026-03-02',
      nextDate: undefined,
    });
  });

  it('should return only a newer neighbour for the oldest entry', function () {
    expect(resolveAdjacentDates(DATES, '2026-03-01')).toEqual({
      previousDate: undefined,
      nextDate: '2026-03-02',
    });
  });

  it('should return both neighbours for a middle entry', function () {
    expect(resolveAdjacentDates(DATES, '2026-03-02')).toEqual({
      previousDate: '2026-03-01',
      nextDate: '2026-03-03',
    });
  });
});
