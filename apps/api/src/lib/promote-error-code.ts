import {DomainValidationError, NotFoundError} from '@domain';

/**
 * A stable, groupable label for a promote failure. Branches on the typed domain
 * errors first, then falls back to the driver's own code — the `postgres`
 * driver hangs a SQLSTATE (e.g. '22001' for a value-too-long) off the error.
 */
export function promoteErrorCode(error: unknown): string | null {
  if (error instanceof DomainValidationError) {
    return 'DOMAIN_VALIDATION';
  }

  if (error instanceof NotFoundError) {
    return 'NOT_FOUND';
  }

  const code = (error as {code?: unknown} | null)?.code;
  return typeof code === 'string' ? code : null;
}
