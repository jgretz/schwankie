import {describe, expect, it} from 'bun:test';
import {currentSectionFor, isLinkSection} from '../../src/lib/current-section';

describe('currentSectionFor', function () {
  it('should map /history to the history section', function () {
    expect(currentSectionFor('/history')).toBe('history');
  });

  it('should map each non-link route to its own section', function () {
    expect(currentSectionFor('/admin/feeds')).toBe('admin');
    expect(currentSectionFor('/feeds')).toBe('feeds');
    expect(currentSectionFor('/emails')).toBe('emails');
    expect(currentSectionFor('/daily-summary')).toBe('daily-summary');
    expect(currentSectionFor('/about')).toBe('about');
  });

  it('should map the link routes to the link sections', function () {
    expect(currentSectionFor('/queue')).toBe('queue');
    expect(currentSectionFor('/')).toBe('public');
  });
});

describe('isLinkSection', function () {
  it('should be true only for the public and queue sections', function () {
    expect(isLinkSection('public')).toBe(true);
    expect(isLinkSection('queue')).toBe(true);
  });

  it('should be false for the history section', function () {
    expect(isLinkSection('history')).toBe(false);
  });

  it('should be false for every other section', function () {
    for (const section of ['feeds', 'emails', 'daily-summary', 'admin', 'about'] as const) {
      expect(isLinkSection(section)).toBe(false);
    }
  });
});
