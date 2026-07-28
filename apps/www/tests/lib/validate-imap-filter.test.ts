import {describe, expect, it} from 'bun:test';
import {validateIMAPFilter} from '../../src/lib/validate-imap-filter';

describe('validateIMAPFilter', function () {
  describe('empty input', function () {
    it('should reject an empty string', function () {
      expect(validateIMAPFilter('')).toEqual({valid: false, error: 'Filter is empty'});
    });

    it('should reject a whitespace-only filter', function () {
      expect(validateIMAPFilter('   \t\n ')).toEqual({valid: false, error: 'Filter is empty'});
    });
  });

  describe('parentheses', function () {
    it('should accept a filter with no parentheses', function () {
      expect(validateIMAPFilter('UNSEEN')).toEqual({valid: true});
    });

    it('should accept balanced nested parentheses', function () {
      expect(validateIMAPFilter('(OR (FROM a) (FROM b))')).toEqual({valid: true});
    });

    it('should reject an unclosed opening parenthesis', function () {
      expect(validateIMAPFilter('(OR (FROM a)')).toEqual({
        valid: false,
        error: 'Unbalanced parentheses',
      });
    });

    it('should reject a stray closing parenthesis', function () {
      expect(validateIMAPFilter('FROM a)')).toEqual({
        valid: false,
        error: 'Unbalanced parentheses',
      });
    });

    it('should ignore parentheses inside a quoted string', function () {
      expect(validateIMAPFilter('SUBJECT "hello :) world"')).toEqual({valid: true});
    });
  });

  describe('quoting', function () {
    it('should accept a closed quoted string', function () {
      expect(validateIMAPFilter('FROM "sender@example.com"')).toEqual({valid: true});
    });

    it('should reject an unclosed quoted string', function () {
      expect(validateIMAPFilter('FROM "sender@example.com')).toEqual({
        valid: false,
        error: 'Unclosed quoted string',
      });
    });

    it('should treat an escaped quote as literal rather than closing the string', function () {
      expect(validateIMAPFilter('SUBJECT "a \\" b"')).toEqual({valid: true});
    });

    it('should reject when an escaped quote leaves the string open', function () {
      expect(validateIMAPFilter('SUBJECT "a \\"')).toEqual({
        valid: false,
        error: 'Unclosed quoted string',
      });
    });

    it('should consume an escaped backslash so the next quote still closes', function () {
      expect(validateIMAPFilter('SUBJECT "a \\\\"')).toEqual({valid: true});
    });
  });

  it('should report the unclosed quote first when both quotes and parens are unbalanced', function () {
    expect(validateIMAPFilter('(FROM "a')).toEqual({
      valid: false,
      error: 'Unclosed quoted string',
    });
  });
});
