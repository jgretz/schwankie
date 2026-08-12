/**
 * Render a stored `YYYY-MM-DD` digest date as a long local date.
 *
 * The stored date is already a local calendar date; parse it as one rather than
 * letting `new Date(date)` treat the bare string as UTC and shift it a day
 * backwards west of Greenwich. A malformed input comes back unchanged.
 */
export function formatSummaryDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return date;

  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
