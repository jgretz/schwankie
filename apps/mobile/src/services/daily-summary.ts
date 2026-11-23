import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {fetchDailySummary, fetchDailySummaryDates, markDailySummaryItemsRead} from 'client';
import type {DailySummaryData} from 'client';
import {isMissingDigestError} from '../lib/is-missing-digest-error';

/**
 * The digest for one day, or `null` for a day the job has not covered.
 *
 * Exported separately from the hook so a test can drive the 404-to-`null`
 * mapping without a React renderer. That mapping is a contract with the message
 * `apiFetch` builds, not with anything in this app.
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

// Marks the RSS and email items inside the digest's stored window as read, so
// the RSS and Emails tabs drop what the digest already covered.
export function useMarkDailySummaryItemsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (date: string) => markDailySummaryItemsRead(date),
    onSuccess: (result) => {
      Toast.show({type: 'success', text1: `Marked ${result.count} as read`});
      queryClient.invalidateQueries({queryKey: ['all-rss-items']});
      queryClient.invalidateQueries({queryKey: ['email-items']});
    },
    onError: (error) => {
      console.error('[useMarkDailySummaryItemsRead] Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to mark as read',
        text2: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}
