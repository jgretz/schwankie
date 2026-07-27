import type {ErrorHandler} from 'hono';
import {HTTPException} from 'hono/http-exception';
import {DomainValidationError, NotFoundError} from '@domain';

/**
 * Central error mapping for the whole app. Unhandled errors return a fixed
 * string rather than `err.message` — echoing the message leaked raw Postgres
 * driver text (e.g. `value too long for type character varying(800)`) to
 * clients as an opaque 500.
 */
export const errorHandler: ErrorHandler = (err, c) => {
  console.error('API error:', err);

  if (err instanceof DomainValidationError) {
    return c.json({error: err.message, field: err.field}, 422);
  }

  if (err instanceof NotFoundError) {
    return c.json({error: 'Not found'}, 404);
  }

  // Hono middleware signals its status by throwing; collapsing that into a 500
  // would turn a 401 or a 413 into a server fault.
  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  return c.json({error: 'Internal server error'}, 500);
};
