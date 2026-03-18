import {describe, expect, it} from 'bun:test';
import {splitHighlights} from '../../../src/components/feed/highlight-text';

describe('splitHighlights', function () {
  it('should mark matching segments case-insensitively', function () {
    const parts = splitHighlights('I use Postgres daily', 'postgres');

    const matches = parts.filter((p) => p.isMatch).map((p) => p.part);
    expect(matches).toHaveLength(1);
    expect(matches[0]).toBe('Postgres');
  });

  it('should return non-matching segments', function () {
    const parts = splitHighlights('foo bar foo', 'bar');

    expect(parts).toHaveLength(3);
    expect(parts[0]).toEqual({part: 'foo ', isMatch: false});
    expect(parts[1]).toEqual({part: 'bar', isMatch: true});
    expect(parts[2]).toEqual({part: ' foo', isMatch: false});
  });

  it('should handle multiple matches', function () {
    const parts = splitHighlights('a b a', 'a');

    const matches = parts.filter((p) => p.isMatch);
    expect(matches).toHaveLength(2);
  });

  it('should not crash on special regex characters', function () {
    const fn = () => splitHighlights('c++ programming', 'c++');
    expect(fn).not.toThrow();
    const parts = fn();
    expect(parts.some((p) => p.isMatch && p.part === 'c++')).toBe(true);
  });

  it('should handle query with dot', function () {
    const parts = splitHighlights('version 1.0 released', '1.0');

    expect(parts.some((p) => p.isMatch && p.part === '1.0')).toBe(true);
  });
});
