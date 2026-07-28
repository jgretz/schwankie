import {describe, expect, it} from 'bun:test';
import {sortTagsByCount} from '../../src/lib/sort-tags';

describe('sortTagsByCount', function () {
  it('should order tags by count descending', function () {
    const tags = [
      {id: 1, text: 'react', count: 3},
      {id: 2, text: 'bun', count: 12},
      {id: 3, text: 'sql', count: 7},
    ];

    const result = sortTagsByCount(tags);

    expect(result.map((t) => t.id)).toEqual([2, 3, 1]);
  });

  it('should not mutate the input array', function () {
    const tags = [
      {id: 1, text: 'react', count: 3},
      {id: 2, text: 'bun', count: 12},
    ];

    sortTagsByCount(tags);

    expect(tags.map((t) => t.id)).toEqual([1, 2]);
  });

  it('should return an empty array for no tags', function () {
    expect(sortTagsByCount([])).toEqual([]);
  });
});
