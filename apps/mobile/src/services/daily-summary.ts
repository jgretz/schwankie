import {useQuery} from '@tanstack/react-query';
import {fetchDailySummary, fetchDailySummaryDates} from 'client';
import type {DailySummaryData} from 'client';
import {isMissingDigestError} from '../lib/is-missing-digest-error';

/**
 * The digest for one day, or `null` for a day the job has not covered.
 *
 * Exported separately from the hook so the 404-to-`null` mapping — a contract
 * with the message `apiFetch` builds, not with anything in this app — can be
 * driven by a test without a React renderer.
 */
export async function fetchDailySummaryOrNull(date?: string): Promise<DailySummaryData | null> {
  try {
    return await fetchDailySummary({date});
  } catch (error) {
    if (isMissingDigestError(error)) return null;
    throw error;
  }
}

export function useDailySummary(date?: string) {
  return useQuery({
    queryKey: ['daily-summary', date ?? 'latest'],
    queryFn: () => fetchDailySummaryOrNull(date),
  });
}

export function useDailySummaryDates() {
  return useQuery({
    queryKey: ['daily-summary-dates'],
    queryFn: () => fetchDailySummaryDates(),
    select: (data) => data.dates,
  });
}
