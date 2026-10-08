import {afterEach, describe, expect, it, spyOn} from 'bun:test';
import {mockDb, setupDb} from '../helpers/setup';
import {searchHistoryCandidates} from '../../src/queries/search-history-candidates';

describe('searchHistoryCandidates', function () {
  setupDb();

  const selectSpy = spyOn(mockDb, 'select');

  afterEach(function () {
    selectSpy.mockClear();
  });

  it('should return no candidates without querying when every term is blank', async function () {
    const result = await searchHistoryCandidates({terms: ['', '   '], days: 30});

    expect(result).toEqual([]);
    expect(selectSpy).toHaveBeenCalledTimes(0);
  });

  it('should return no candidates for an empty term list', async function () {
    const result = await searchHistoryCandidates({terms: [], days: 30});

    expect(result).toEqual([]);
    expect(selectSpy).toHaveBeenCalledTimes(0);
  });
});
