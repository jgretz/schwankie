import {describe, expect, it} from 'bun:test';
import {isMissingDigestError} from '../../src/lib/is-missing-digest-error';

describe('isMissingDigestError', function () {
  it('should be true for the API 404 raised when a day has no digest', function () {
    const error = new Error('API error: 404 Not Found — {"error":"Daily summary not found"}');

    expect(isMissingDigestError(error)).toBe(true);
  });

  it('should be false for a server error', function () {
    const error = new Error('API error: 500 Internal Server Error — {"error":"boom"}');

    expect(isMissingDigestError(error)).toBe(false);
  });

  it('should be false when only the response body mentions 404', function () {
    const error = new Error('API error: 500 Internal Server Error — {"error":"upstream gave 404"}');

    expect(isMissingDigestError(error)).toBe(false);
  });

  it('should be false for a non-Error value', function () {
    expect(isMissingDigestError('API error: 404 Not Found')).toBe(false);
    expect(isMissingDigestError(null)).toBe(false);
  });
});
