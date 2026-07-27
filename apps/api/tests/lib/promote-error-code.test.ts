import {describe, it, expect} from 'bun:test';
// Deep import rather than `@domain`: route test files mock that barrel
// globally, and the assertion here is about `instanceof` class identity.
import {DomainValidationError, NotFoundError} from 'domain/src/lib/errors';
import {promoteErrorCode} from '../../src/lib/promote-error-code';

describe('promoteErrorCode', function () {
  it('should label a DomainValidationError', function () {
    const code = promoteErrorCode(new DomainValidationError('url', 'url is too long'));

    expect(code).toBe('DOMAIN_VALIDATION');
  });

  it('should label a NotFoundError', function () {
    const code = promoteErrorCode(new NotFoundError('rssItem', 'item-1'));

    expect(code).toBe('NOT_FOUND');
  });

  it('should fall back to the driver SQLSTATE', function () {
    const driverError = Object.assign(new Error('value too long for type character varying'), {
      code: '22001',
    });

    expect(promoteErrorCode(driverError)).toBe('22001');
  });

  it('should return null for a plain error carrying no code', function () {
    expect(promoteErrorCode(new Error('boom'))).toBeNull();
  });

  it('should ignore a non-string code rather than coercing it', function () {
    const weird = Object.assign(new Error('boom'), {code: 500});

    expect(promoteErrorCode(weird)).toBeNull();
  });

  it('should tolerate non-error throwables', function () {
    expect(promoteErrorCode('boom')).toBeNull();
    expect(promoteErrorCode(null)).toBeNull();
    expect(promoteErrorCode(undefined)).toBeNull();
  });
});
