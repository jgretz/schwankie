import {describe, expect, it} from 'bun:test';
import {opensLink} from '../../src/lib/opens-link';

describe('opensLink', function () {
  it('should open the link when the primary button is clicked', function () {
    expect(opensLink(0)).toBe(true);
  });

  it('should open the link when the middle button is clicked', function () {
    expect(opensLink(1)).toBe(true);
  });

  it('should not open the link when the secondary button is clicked', function () {
    expect(opensLink(2)).toBe(false);
  });
});
