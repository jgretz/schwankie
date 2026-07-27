/**
 * Typed domain errors. Callers (and the API error handler) branch on the error
 * type rather than string-matching a message, so wording can change freely.
 */

type ErrorOptions = {cause?: unknown};

/** A value the caller supplied cannot be persisted as-is. */
export class DomainValidationError extends Error {
  readonly field: string;

  constructor(field: string, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'DomainValidationError';
    this.field = field;
  }
}

/** A record the caller referenced by id does not exist. */
export class NotFoundError extends Error {
  readonly resource: string;
  readonly id: string;

  constructor(resource: string, id: string, options?: ErrorOptions) {
    super(`${resource} ${id} not found`, options);
    this.name = 'NotFoundError';
    this.resource = resource;
    this.id = id;
  }
}
