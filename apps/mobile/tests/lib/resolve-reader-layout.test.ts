import {describe, expect, it} from 'bun:test';
import {
  MAX_SPLIT_LIST_WIDTH,
  MIN_SPLIT_LIST_WIDTH,
  resolveReaderLayout,
} from '../../src/lib/resolve-reader-layout';

describe('resolveReaderLayout', function () {
  it('should fill the window in portrait even with a link open', function () {
    const layout = resolveReaderLayout({width: 430, height: 932, hasOpenLink: true});

    expect(layout).toEqual({mode: 'full'});
  });

  it('should fill the window when the window is square', function () {
    const layout = resolveReaderLayout({width: 800, height: 800, hasOpenLink: true});

    expect(layout).toEqual({mode: 'full'});
  });

  it('should fill the window in landscape with no link open', function () {
    const layout = resolveReaderLayout({width: 1100, height: 800, hasOpenLink: false});

    expect(layout).toEqual({mode: 'full'});
  });

  it('should give the list a proportional width when a link is open', function () {
    const layout = resolveReaderLayout({width: 1000, height: 800, hasOpenLink: true});

    expect(layout).toEqual({mode: 'split', listWidth: 380});
  });

  it('should floor the split list width on a short landscape phone', function () {
    const layout = resolveReaderLayout({width: 700, height: 390, hasOpenLink: true});

    expect(layout).toEqual({mode: 'split', listWidth: MIN_SPLIT_LIST_WIDTH});
  });

  it('should cap the split list width on a wide window', function () {
    const layout = resolveReaderLayout({width: 2000, height: 1200, hasOpenLink: true});

    expect(layout).toEqual({mode: 'split', listWidth: MAX_SPLIT_LIST_WIDTH});
  });
});
