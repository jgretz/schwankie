import {describe, expect, it} from 'bun:test';
import {fitLinkFields} from '../../src/lib/fit-link-fields';
import {DomainValidationError} from '../../src/lib/errors';

const ELLIPSIS = '…';

function repeat(char: string, count: number): string {
  return Array.from({length: count}, () => char).join('');
}

function codePoints(value: string): number {
  return Array.from(value).length;
}

describe('fitLinkFields', function () {
  describe('url', function () {
    it('should pass a url through unchanged when it fits', function () {
      const result = fitLinkFields({url: 'https://example.com/article'});

      expect(result.url).toBe('https://example.com/article');
    });

    it('should throw DomainValidationError naming url when over 2048 code points', function () {
      const url = `https://example.com/${repeat('a', 2100)}`;

      expect(() => fitLinkFields({url})).toThrow(DomainValidationError);
    });

    it('should carry the offending field on the thrown error', function () {
      const url = `https://example.com/${repeat('a', 2100)}`;

      try {
        fitLinkFields({url});
        throw new Error('expected fitLinkFields to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(DomainValidationError);
        expect((error as DomainValidationError).field).toBe('url');
      }
    });

    it('should accept a url of exactly 2048 code points', function () {
      const url = repeat('a', 2048);

      expect(fitLinkFields({url}).url).toBe(url);
    });
  });

  describe('title', function () {
    it('should pass a title through unchanged when it fits', function () {
      const result = fitLinkFields({url: 'https://example.com', title: 'Short title'});

      expect(result.title).toBe('Short title');
    });

    it('should truncate an over-long title to 500 code points with an ellipsis', function () {
      const result = fitLinkFields({url: 'https://example.com', title: repeat('a', 900)});

      expect(codePoints(result.title)).toBe(500);
      expect(result.title.endsWith(ELLIPSIS)).toBe(true);
    });

    it('should truncate by code point so astral characters stay intact', function () {
      const result = fitLinkFields({url: 'https://example.com', title: repeat('😀', 501)});

      expect(codePoints(result.title)).toBe(500);
      // A lone surrogate half would make the UTF-16 length odd for a run of
      // astral characters plus the ellipsis.
      expect(result.title.length).toBe(499 * 2 + 1);
    });

    it('should fall back to the url when the title is absent', function () {
      const result = fitLinkFields({url: 'https://example.com/article'});

      expect(result.title).toBe('https://example.com/article');
    });

    it('should fall back to the url when the title is whitespace only', function () {
      const result = fitLinkFields({url: 'https://example.com/article', title: '   '});

      expect(result.title).toBe('https://example.com/article');
    });

    it('should trim surrounding whitespace off a title it keeps', function () {
      const result = fitLinkFields({url: 'https://example.com', title: '  Short title\n'});

      expect(result.title).toBe('Short title');
    });

    it('should truncate the url fallback when the url exceeds the title bound', function () {
      const url = `https://example.com/${repeat('a', 600)}`;

      const result = fitLinkFields({url, title: null});

      expect(codePoints(result.title)).toBe(500);
      expect(result.title.endsWith(ELLIPSIS)).toBe(true);
    });
  });

  describe('description', function () {
    it('should truncate an over-long description to 800 code points with an ellipsis', function () {
      const result = fitLinkFields({url: 'https://example.com', description: repeat('a', 5000)});

      expect(codePoints(result.description!)).toBe(800);
      expect(result.description!.endsWith(ELLIPSIS)).toBe(true);
    });

    it('should leave a description of exactly 800 code points alone', function () {
      const description = repeat('a', 800);

      const result = fitLinkFields({url: 'https://example.com', description});

      expect(result.description).toBe(description);
    });

    it('should return undefined for an empty description', function () {
      const result = fitLinkFields({url: 'https://example.com', description: ''});

      expect(result.description).toBeUndefined();
    });

    it('should return undefined for a null description', function () {
      const result = fitLinkFields({url: 'https://example.com', description: null});

      expect(result.description).toBeUndefined();
    });

    it('should return undefined for a whitespace-only description', function () {
      const result = fitLinkFields({url: 'https://example.com', description: ' \n\t '});

      expect(result.description).toBeUndefined();
    });
  });

  describe('imageUrl', function () {
    it('should pass an image url through unchanged when it fits', function () {
      const result = fitLinkFields({
        url: 'https://example.com',
        imageUrl: 'https://example.com/image.jpg',
      });

      expect(result.imageUrl).toBe('https://example.com/image.jpg');
    });

    it('should drop an over-long image url rather than truncate it', function () {
      const result = fitLinkFields({
        url: 'https://example.com',
        imageUrl: `https://example.com/${repeat('a', 2100)}.jpg`,
      });

      expect(result.imageUrl).toBeUndefined();
    });

    it('should return undefined for an empty image url', function () {
      const result = fitLinkFields({url: 'https://example.com', imageUrl: ''});

      expect(result.imageUrl).toBeUndefined();
    });

    it('should return undefined for a whitespace-only image url', function () {
      const result = fitLinkFields({url: 'https://example.com', imageUrl: '  '});

      expect(result.imageUrl).toBeUndefined();
    });
  });
});
