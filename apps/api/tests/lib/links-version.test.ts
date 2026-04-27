import {describe, it, expect, beforeEach} from 'bun:test';
import {bumpLinksVersion, getLinksVersion, resetLinksVersion} from '../../src/lib/links-version';

describe('links-version', function () {
  beforeEach(function () {
    resetLinksVersion();
  });

  it('should return null before any bump', function () {
    expect(getLinksVersion()).toBeNull();
  });

  it('should return an ISO timestamp after a bump', function () {
    bumpLinksVersion();
    const value = getLinksVersion();
    expect(value).not.toBeNull();
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('should change value on each bump', async function () {
    bumpLinksVersion();
    const first = getLinksVersion();
    await new Promise((resolve) => setTimeout(resolve, 5));
    bumpLinksVersion();
    const second = getLinksVersion();
    expect(second).not.toBe(first);
  });

  it('should return null after reset', function () {
    bumpLinksVersion();
    expect(getLinksVersion()).not.toBeNull();
    resetLinksVersion();
    expect(getLinksVersion()).toBeNull();
  });
});
