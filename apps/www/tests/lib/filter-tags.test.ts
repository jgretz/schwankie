import {describe, expect, it} from 'bun:test';
import {filterTags} from '../../src/lib/filter-tags';

const TAGS = [
  {id: 1, text: 'React', count: 3},
  {id: 2, text: 'bun', count: 12},
];

describe('filterTags', function () {
  it('should return the input array as-is for an empty query', function () {
    expect(filterTags(TAGS, '')).toBe(TAGS);
  });

  it('should match on the tag text', function () {
    expect(filterTags(TAGS, 'bun').map((t) => t.id)).toEqual([2]);
  });

  it('should match case-insensitively', function () {
    expect(filterTags(TAGS, 'react').map((t) => t.id)).toEqual([1]);
    expect(filterTags(TAGS, 'BUN').map((t) => t.id)).toEqual([2]);
  });

  it('should return an empty array when nothing matches', function () {
    expect(filterTags(TAGS, 'nonesuch')).toEqual([]);
  });

  it('should not mutate the input array', function () {
    filterTags(TAGS, 'bun');

    expect(TAGS.map((t) => t.id)).toEqual([1, 2]);
  });

  it('should not trim the query', function () {
    expect(filterTags(TAGS, ' bun')).toEqual([]);
  });
});
