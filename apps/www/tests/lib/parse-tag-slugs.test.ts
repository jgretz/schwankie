import {describe, expect, it} from 'bun:test';
import {parseTagSlugs} from '../../src/lib/parse-tag-slugs';

describe('parseTagSlugs', function () {
  it('should return empty array for undefined', function () {
    expect(parseTagSlugs(undefined)).toEqual([]);
  });

  it('should return empty array for empty string', function () {
    expect(parseTagSlugs('')).toEqual([]);
  });

  it('should split comma-separated slugs', function () {
    expect(parseTagSlugs('a,b,c')).toEqual(['a', 'b', 'c']);
  });

  it('should filter empty segments from leading comma', function () {
    expect(parseTagSlugs(',a')).toEqual(['a']);
  });

  it('should filter empty segments from trailing comma', function () {
    expect(parseTagSlugs('a,')).toEqual(['a']);
  });

  it('should filter empty segments from double commas', function () {
    expect(parseTagSlugs('a,,b')).toEqual(['a', 'b']);
  });

  it('should filter empty segments from mixed commas', function () {
    expect(parseTagSlugs(',a,,b,')).toEqual(['a', 'b']);
  });

  it('should handle single slug without commas', function () {
    expect(parseTagSlugs('foo')).toEqual(['foo']);
  });
});
