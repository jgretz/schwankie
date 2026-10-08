import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {describe, expect, it} from 'bun:test';
import {createDatabase} from 'database';
import {
  emailCandidateQuery,
  HISTORY_CANDIDATE_LIMIT,
  mergeHistoryCandidates,
  rssCandidateQuery,
} from '../../src/lib/history-candidates';
import type {HistoryCandidate} from '../../src/types';

// postgres-js connects lazily, so rendering with toSQL() never touches the
// network. The FTS path is asserted by its SQL shape, not run through mock-db:
// mock-db's evaluateCondition passes any operator it does not recognise.
const db = createDatabase('postgres://nobody@127.0.0.1:1/none');
const WINDOW_START = new Date('2026-09-08T12:00:00Z');
const TERMS = ['local llm hardware', 'startup'];

function tsqueryPattern(): RegExp {
  return /\(plainto_tsquery\('english', \$(\d+)\) \|\| plainto_tsquery\('english', \$(\d+)\)\)/g;
}

function paramAt(params: unknown[], placeholder: string): unknown {
  return params[Number(placeholder) - 1];
}

describe('rssCandidateQuery', function () {
  const {sql, params} = rssCandidateQuery(db, {terms: TERMS, windowStart: WINDOW_START}).toSQL();

  it('should bind every term as its own plainto_tsquery parameter, ORed together', function () {
    const matches = [...sql.matchAll(tsqueryPattern())];

    expect(matches).toHaveLength(2);
    for (const [, first, second] of matches) {
      expect(paramAt(params, first)).toBe('local llm hardware');
      expect(paramAt(params, second)).toBe('startup');
    }
    expect(sql).not.toMatch(/(?<!plain)to_tsquery\(/);
  });

  it('should exclude disabled feeds', function () {
    const match = sql.match(/"feed"\."disabled" = \$(\d+)/);

    expect(match).not.toBeNull();
    expect(paramAt(params, match![1])).toBe(false);
  });

  it('should window on ingestion time', function () {
    const match = sql.match(/"rss_item"\."created_at" >= \$(\d+)/);

    expect(match).not.toBeNull();
    expect(paramAt(params, match![1])).toBe(WINDOW_START.toISOString());
  });

  it('should match the stored search vector against the tsquery', function () {
    expect(sql).toContain(`"rss_item"."search_vector" @@ (plainto_tsquery`);
  });

  it('should rank by the stored search vector', function () {
    expect(sql).toContain(`ts_rank("rss_item"."search_vector", (plainto_tsquery`);
  });

  it('should not build a tsvector at query time', function () {
    expect(sql).not.toContain('to_tsvector');
  });

  it('should boost opened items in the rank', function () {
    expect(sql).toContain(`case when "rss_item"."opened_at" is not null then 1.5 else 1 end`);
    expect(sql).toContain('::float8 as "rank"');
  });

  it('should order by the rank alias and cap the candidates', function () {
    const match = sql.match(/order by "rank" desc limit \$(\d+)$/);

    expect(match).not.toBeNull();
    expect(paramAt(params, match![1])).toBe(HISTORY_CANDIDATE_LIMIT);
    expect(HISTORY_CANDIDATE_LIMIT).toBe(50);
  });
});

describe('emailCandidateQuery', function () {
  const {sql, params} = emailCandidateQuery(db, {terms: TERMS, windowStart: WINDOW_START}).toSQL();

  it('should bind every term as its own plainto_tsquery parameter', function () {
    const matches = [...sql.matchAll(tsqueryPattern())];

    expect(matches).toHaveLength(2);
    for (const [, first, second] of matches) {
      expect(paramAt(params, first)).toBe('local llm hardware');
      expect(paramAt(params, second)).toBe('startup');
    }
  });

  it('should window on import time', function () {
    const match = sql.match(/"email_item"\."imported_at" >= \$(\d+)/);

    expect(match).not.toBeNull();
    expect(paramAt(params, match![1])).toBe(WINDOW_START.toISOString());
  });

  it('should match the stored search vector against the tsquery', function () {
    expect(sql).toContain(`"email_item"."search_vector" @@ (plainto_tsquery`);
  });

  it('should not build a tsvector at query time', function () {
    expect(sql).not.toContain('to_tsvector');
  });

  it('should boost opened items and order by the rank alias', function () {
    expect(sql).toMatch(/case when ("email_item"\.)?"opened_at" is not null then 1\.5 else 1 end/);
    expect(sql).toMatch(/order by "rank" desc limit \$\d+$/);
  });
});

// The weighting moved into the generated columns of migration 0020; these pin
// it so ranking cannot change silently if the migration is regenerated.
describe('search vector migration', function () {
  const migration = readFileSync(
    join(import.meta.dir, '../../../database/drizzle/0020_add-item-search-vector.sql'),
    'utf8',
  );

  it('should weight rss title, summary and capped content', function () {
    expect(migration).toContain(`setweight(to_tsvector('english', coalesce("title", '')), 'A')`);
    expect(migration).toContain(`setweight(to_tsvector('english', coalesce("summary", '')), 'B')`);
    expect(migration).toContain(
      `setweight(to_tsvector('english', left(coalesce("content", ''), 2000)), 'C')`,
    );
  });

  it('should weight email title and subject over description', function () {
    expect(migration).toContain(
      `setweight(to_tsvector('english', coalesce("email_subject", '')), 'A')`,
    );
    expect(migration).toContain(
      `setweight(to_tsvector('english', coalesce("description", '')), 'B')`,
    );
  });

  it('should index both search vectors with gin', function () {
    expect(migration).toContain(`ON "rss_item" USING gin ("search_vector")`);
    expect(migration).toContain(`ON "email_item" USING gin ("search_vector")`);
  });
});

function makeCandidate(overrides: Partial<HistoryCandidate> = {}): HistoryCandidate {
  return {
    kind: 'rss',
    feedId: 'feed-1',
    id: 'item-1',
    title: 'A title',
    url: 'https://example.com/a',
    source: 'Feed',
    summary: null,
    ingestedAt: new Date('2026-10-01T00:00:00Z'),
    openedAt: null,
    promoted: false,
    rank: 0.1,
    ...overrides,
  } as HistoryCandidate;
}

describe('mergeHistoryCandidates', function () {
  it('should collapse duplicate urls to the higher rank', function () {
    const rss = makeCandidate({id: 'rss', url: 'https://example.com/a/', rank: 0.2});
    const email = makeCandidate({
      kind: 'email',
      id: 'email',
      url: 'https://example.com/a?utm_source=newsletter',
      rank: 0.5,
    });

    const result = mergeHistoryCandidates([rss], [email], 50);

    expect(result.map((c) => c.id)).toEqual(['email']);
  });

  it('should break a rank tie toward the newer item', function () {
    const older = makeCandidate({id: 'older', ingestedAt: new Date('2026-09-01T00:00:00Z')});
    const newer = makeCandidate({
      kind: 'email',
      id: 'newer',
      ingestedAt: new Date('2026-09-20T00:00:00Z'),
    });

    const result = mergeHistoryCandidates([older], [newer], 50);

    expect(result.map((c) => c.id)).toEqual(['newer']);
  });

  it('should sort by rank descending across both sources', function () {
    const rss = [
      makeCandidate({id: 'r1', url: 'https://example.com/1', rank: 0.3}),
      makeCandidate({id: 'r2', url: 'https://example.com/2', rank: 0.1}),
    ];
    const email = [
      makeCandidate({kind: 'email', id: 'e1', url: 'https://example.com/3', rank: 0.2}),
    ];

    const result = mergeHistoryCandidates(rss, email, 50);

    expect(result.map((c) => c.id)).toEqual(['r1', 'e1', 'r2']);
  });

  it('should cap the merged list', function () {
    const rss = Array.from({length: 4}, function (_, i) {
      return makeCandidate({id: `r${i}`, url: `https://example.com/${i}`, rank: i});
    });

    const result = mergeHistoryCandidates(rss, [], 2);

    expect(result.map((c) => c.id)).toEqual(['r3', 'r2']);
  });
});
