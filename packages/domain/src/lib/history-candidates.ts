import {emailItem, feed, rssItem, type Database} from 'database';
import {and, eq, gte, sql, type AnyColumn, type SQL} from 'drizzle-orm';
import type {HistoryCandidate} from '../types';
import {normalizeUrl} from './normalize-url';

/** Rank multiplier for items the owner has already opened from a reader. */
export const HISTORY_OPENED_BOOST = 1.5;
export const HISTORY_CANDIDATE_LIMIT = 50;

type CandidateQueryArgs = {
  terms: string[];
  windowStart: Date;
  limit?: number;
};

/**
 * Terms are ORed; words inside one term are ANDed by plainto_tsquery. Every
 * term is a bound parameter: user and LLM text must never reach to_tsquery,
 * whose syntax would make it an injection and parse-error surface.
 */
export function buildHistoryTsQuery(terms: string[]): SQL {
  const parts = terms.map((term) => sql`plainto_tsquery('english', ${term})`);
  return sql`(${sql.join(parts, sql` || `)})`;
}

// Stored generated columns with GIN indexes, created by migration 0020, which
// holds the weighting. They are not in the drizzle schema (drizzle-orm 0.30
// cannot declare a generated column), so they are referenced here by name.
const rssSearchVector = sql`"rss_item"."search_vector"`;
const emailSearchVector = sql`"email_item"."search_vector"`;

// Constants are inlined with sql.raw rather than bound: a bound value would
// render a fresh $n at every occurrence of the expression.
const openedBoost = sql.raw(String(HISTORY_OPENED_BOOST));

function rankExpression(vector: SQL, tsquery: SQL, openedAt: AnyColumn) {
  return sql<number>`(ts_rank(${vector}, ${tsquery}) * case when ${openedAt} is not null then ${openedBoost} else 1 end)::float8`;
}

// Ordering by the select-list alias, not the expression: repeating the
// expression re-binds its tsquery parameters, so Postgres would rebuild the
// query and rank every matched row a second time.
const byRankDesc = sql`"rank" desc`;

export function rssCandidateQuery(db: Database, args: CandidateQueryArgs) {
  const {terms, windowStart, limit = HISTORY_CANDIDATE_LIMIT} = args;
  const tsquery = buildHistoryTsQuery(terms);

  return db
    .select({
      id: rssItem.id,
      feedId: rssItem.feedId,
      source: feed.name,
      title: rssItem.title,
      url: rssItem.link,
      summary: rssItem.summary,
      ingestedAt: rssItem.createdAt,
      openedAt: rssItem.openedAt,
      promoted: rssItem.promoted,
      rank: rankExpression(rssSearchVector, tsquery, rssItem.openedAt).as('rank'),
    })
    .from(rssItem)
    .innerJoin(feed, eq(rssItem.feedId, feed.id))
    .where(
      and(
        eq(feed.disabled, false),
        gte(rssItem.createdAt, windowStart),
        sql`${rssSearchVector} @@ ${tsquery}`,
      ),
    )
    .orderBy(byRankDesc)
    .limit(limit);
}

export function emailCandidateQuery(db: Database, args: CandidateQueryArgs) {
  const {terms, windowStart, limit = HISTORY_CANDIDATE_LIMIT} = args;
  const tsquery = buildHistoryTsQuery(terms);

  return db
    .select({
      id: emailItem.id,
      source: emailItem.emailFrom,
      title: emailItem.title,
      emailSubject: emailItem.emailSubject,
      url: emailItem.link,
      summary: emailItem.description,
      ingestedAt: emailItem.importedAt,
      openedAt: emailItem.openedAt,
      promoted: emailItem.promoted,
      rank: rankExpression(emailSearchVector, tsquery, emailItem.openedAt).as('rank'),
    })
    .from(emailItem)
    .where(and(gte(emailItem.importedAt, windowStart), sql`${emailSearchVector} @@ ${tsquery}`))
    .orderBy(byRankDesc)
    .limit(limit);
}

type RssCandidateRow = Awaited<ReturnType<typeof rssCandidateQuery>>[number];
type EmailCandidateRow = Awaited<ReturnType<typeof emailCandidateQuery>>[number];

export function toRssCandidate(row: RssCandidateRow): HistoryCandidate {
  return {...row, kind: 'rss', rank: Number(row.rank)};
}

export function toEmailCandidate(row: EmailCandidateRow): HistoryCandidate {
  const {emailSubject, ...rest} = row;
  return {
    ...rest,
    kind: 'email',
    // email_item.title is nullable; the subject, then the url, is what the
    // owner would recognise instead.
    title: row.title ?? emailSubject ?? row.url,
    rank: Number(row.rank),
  };
}

function byRankThenNewest(a: HistoryCandidate, b: HistoryCandidate): number {
  return b.rank - a.rank || b.ingestedAt.getTime() - a.ingestedAt.getTime();
}

/**
 * One list across both sources. The same article often arrives through a
 * feed and a newsletter; those collapse to the stronger copy.
 */
export function mergeHistoryCandidates(
  rss: HistoryCandidate[],
  email: HistoryCandidate[],
  limit: number,
): HistoryCandidate[] {
  const byUrl = new Map<string, HistoryCandidate>();
  for (const candidate of [...rss, ...email]) {
    const key = normalizeUrl(candidate.url);
    const existing = byUrl.get(key);
    if (!existing || byRankThenNewest(candidate, existing) < 0) byUrl.set(key, candidate);
  }

  return [...byUrl.values()].sort(byRankThenNewest).slice(0, limit);
}
