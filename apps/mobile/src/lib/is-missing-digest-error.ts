/**
 * True for the one API failure that means "no digest for that day" rather than
 * a fault: `GET /api/digest/daily-summary` answers 404 for a day the job has
 * not covered.
 *
 * `apiFetch` formats every failure as `API error: <status> <statusText> — <body>`
 * (`packages/client/src/config.ts`), so the match is anchored to the front of
 * the message: a 500 whose response body happens to contain "404" is a real
 * error and must not be swallowed as an empty state.
 */
export function isMissingDigestError(error: unknown): boolean {
  return error instanceof Error && error.message.startsWith('API error: 404');
}
