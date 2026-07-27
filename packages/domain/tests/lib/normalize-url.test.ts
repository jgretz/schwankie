import {describe, expect, it} from 'bun:test';
import {normalizeUrl} from '../../src/lib/normalize-url';

describe('normalizeUrl', function () {
  it('should strip trailing slashes', function () {
    expect(normalizeUrl('https://example.com/')).toBe('https://example.com');
  });

  it('should remove tracking parameters', function () {
    const url = 'https://example.com/article?utm_source=email&utm_campaign=test&other=value';

    const normalized = normalizeUrl(url);

    expect(normalized).not.toContain('utm_source');
    expect(normalized).not.toContain('utm_campaign');
    expect(normalized).toContain('other=value');
  });

  it('should handle invalid URLs gracefully', function () {
    const result = normalizeUrl('not a url');

    expect(result).toBe('not a url');
  });

  it('should trim whitespace', function () {
    expect(normalizeUrl('  https://example.com  ')).toBe('https://example.com');
  });

  it('should unwrap a buttondown tracking url to its destination', function () {
    const destination = 'https://example.com/real-article';
    const encoded = btoa(`123|abc|${destination}`).replace(/\+/g, '-').replace(/\//g, '_');

    const result = normalizeUrl(`https://buttondown.com/c/${encoded}`);

    expect(result).toBe(destination);
  });

  it('should leave a buttondown url alone when the payload does not decode', function () {
    const url = 'https://buttondown.com/c/notbase64payload';

    const result = normalizeUrl(url);

    expect(result).toBe(url);
  });

  it('should normalize the same article reached two ways to one string', function () {
    const viaFeed = 'https://example.com/post/';
    const viaNewsletter = 'https://example.com/post?utm_source=newsletter&mc_cid=abc';

    expect(normalizeUrl(viaFeed)).toBe(normalizeUrl(viaNewsletter));
  });
});
