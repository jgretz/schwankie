export type AdjacentDates = {
  previousDate: string | undefined;
  nextDate: string | undefined;
};

const NONE: AdjacentDates = {previousDate: undefined, nextDate: undefined};

/**
 * Pick the digest dates either side of `activeDate`.
 *
 * `dates` is newest-first, so the older neighbour is the *higher* index and the
 * newer one the lower. An unknown or absent active date has no neighbours.
 */
export function resolveAdjacentDates(
  dates: string[] | undefined,
  activeDate: string | undefined,
): AdjacentDates {
  if (!dates || !activeDate) return NONE;

  const index = dates.indexOf(activeDate);
  if (index === -1) return NONE;

  return {previousDate: dates[index + 1], nextDate: dates[index - 1]};
}
