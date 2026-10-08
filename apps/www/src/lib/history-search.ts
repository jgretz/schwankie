import type {HistoryDays, HistoryMatch} from 'client';

export const HISTORY_RANGES = [
  {days: 7, label: 'This week'},
  {days: 30, label: 'This month'},
  {days: 90, label: '3 months'},
] as const satisfies ReadonlyArray<{days: HistoryDays; label: string}>;

export const DEFAULT_HISTORY_DAYS: HistoryDays = 30;

/** Anything a URL could carry that is not a supported window becomes the default. */
export function parseHistoryDays(value: unknown): HistoryDays {
  const days = typeof value === 'string' ? Number(value) : value;
  return HISTORY_RANGES.find((range) => range.days === days)?.days ?? DEFAULT_HISTORY_DAYS;
}

export function formatHistoryMeta(match: Pick<HistoryMatch, 'source' | 'ingestedAt'>): string {
  const date = new Date(match.ingestedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${match.source} · ${date}`;
}
