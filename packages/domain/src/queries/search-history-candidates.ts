import {getDb} from '../db';
import {
  emailCandidateQuery,
  HISTORY_CANDIDATE_LIMIT,
  mergeHistoryCandidates,
  rssCandidateQuery,
  toEmailCandidate,
  toRssCandidate,
} from '../lib/history-candidates';
import type {HistoryCandidate, SearchHistoryCandidatesParams} from '../types';

const DAY_MS = 86_400_000;

/**
 * Full-text candidates for a history search, across rss and email items.
 *
 * The window is on ingestion time for the reasons in list-digest-source-items.ts.
 * Why the search vector is computed at query time rather than indexed is in
 * docs/history-search.md.
 */
export async function searchHistoryCandidates(
  params: SearchHistoryCandidatesParams,
): Promise<HistoryCandidate[]> {
  const {days, now = new Date()} = params;
  const terms = params.terms.map((term) => term.trim()).filter((term) => term.length > 0);
  if (terms.length === 0) return [];

  const db = getDb();
  const windowStart = new Date(now.getTime() - days * DAY_MS);

  const [rssRows, emailRows] = await Promise.all([
    rssCandidateQuery(db, {terms, windowStart}),
    emailCandidateQuery(db, {terms, windowStart}),
  ]);

  return mergeHistoryCandidates(
    rssRows.map(toRssCandidate),
    emailRows.map(toEmailCandidate),
    HISTORY_CANDIDATE_LIMIT,
  );
}
