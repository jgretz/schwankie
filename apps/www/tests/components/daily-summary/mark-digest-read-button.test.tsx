import {describe, expect, it} from 'bun:test';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MarkDigestReadButton} from '../../../src/components/daily-summary/mark-digest-read-button';

// The class list carries `disabled:` variants, so look for the attribute itself.
const DISABLED_ATTR = /\sdisabled=""/;

function render(isPending: boolean): string {
  return renderToStaticMarkup(createElement(MarkDigestReadButton, {isPending, onClick() {}}));
}

describe('MarkDigestReadButton', function () {
  it('should offer an enabled Mark as read button when idle', function () {
    const html = render(false);

    expect(html).toContain('>Mark as read</button>');
    expect(html).not.toMatch(DISABLED_ATTR);
  });

  it('should show a disabled Marking… button while pending', function () {
    const html = render(true);

    expect(html).toContain('>Marking…</button>');
    expect(html).toMatch(DISABLED_ATTR);
  });
});
