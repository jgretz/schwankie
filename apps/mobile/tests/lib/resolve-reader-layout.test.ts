import {describe, expect, it} from 'bun:test';
import {
  MAX_CENTERED_LIST_WIDTH,
  MAX_SPLIT_LIST_WIDTH,
  MIN_SPLIT_LIST_WIDTH,
  resolveReaderLayout,
} from '../../src/lib/resolve-reader-layout';

describe('resolveReaderLayout', function () {
  it('should stack in portrait even with a link open', function () {
    const layout = resolveReaderLayout({width: 430, height: 932, hasOpenLink: true});

    expect(layout).toEqual({mode: 'stacked'});
  });

  it('should stack when the window is square', function () {
    const layout = resolveReaderLayout({width: 800, height: 800, hasOpenLink: false});

    expect(layout).toEqual({mode: 'stacked'});
  });

  it('should center a capped list in landscape with no link open', function () {
    const layout = resolveReaderLayout({width: 1100, height: 800, hasOpenLink: false});

    expect(layout).toEqual({mode: 'centered', listWidth: MAX_CENTERED_LIST_WIDTH});
  });

  it('should not exceed the window width when centering on a narrow landscape window', function () {
    const layout = resolveReaderLayout({width: 600, height: 400, hasOpenLink: false});

    expect(layout).toEqual({mode: 'centered', listWidth: 600});
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
