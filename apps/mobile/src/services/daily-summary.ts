import {useQuery} from '@tanstack/react-query';
import {fetchDailySummary, fetchDailySummaryDates} from 'client';
import type {DailySummaryData} from 'client';
import {isMissingDigestError} from '../lib/is-missing-digest-error';

export function useDailySummary(date?: string) {
  return useQuery({
    queryKey: ['daily-summary', date ?? 'latest'],
    queryFn: async (): Promise<DailySummaryData | null> => {
      try {
        return await fetchDailySummary({date});
      } catch (error) {
        // A day the digest job has not covered is an empty state, not a failure.
        if (isMissingDigestError(error)) return null;
        throw error;
      }
    },
  });
}

export function useDailySummaryDates() {
  return useQuery({
    queryKey: ['daily-summary-dates'],
    queryFn: () => fetchDailySummaryDates(),
    select: (data) => data.dates,
  });
}
