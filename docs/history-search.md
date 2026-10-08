# History Search

<!-- Adding an incidental implementation note (dependency override, workaround, gotcha)? It goes in the top-level "## Implementation Notes" section — never nested under a tier/layer/phase heading. See .claude/rules/doc-structure.md. -->

Most RSS and email items are read in the readers and never promoted, so they never
become links. Later the owner remembers one only roughly: "a link to dedicated hardware
for a local LLM startup, within the last month". `/history` finds it again.

## Retrieve, Then Judge

`GET /api/history/search?q=<description>&days=<7|30|90>` (auth required) runs three
steps inside the API (`apps/api/src/commands/search-history.ts`):

1. **Expand.** Claude Haiku turns the description into up to 12 short search terms
   (structured output). The description's own words are always appended.
2. **Retrieve.** Postgres full-text search over `rss_item` and `email_item` in the
   window returns up to 50 candidates, ranked by `ts_rank` with a boost for items
   already opened from a reader. The same article arriving by feed and newsletter
   collapses to one candidate by normalized URL.
3. **Judge.** Haiku reads the candidates and returns at most 5 `{id, reason}`, best
   first. Ids it invents are dropped.

Keyword ranking alone cannot do step 3. In the motivating case the right item and its
near-misses (other local-AI hardware stories in the same window) share almost every
term; one word, "startup", separates them, and only a reader can weigh it.

## Why No Vector Path

Link embeddings come from Ollama on the mac mini, via `apps/tasks`. The API runs on
Fly and cannot embed a query at request time, so retrieval is lexical.

## The Window Is on Ingestion Time

`rss_item.created_at` and `email_item.imported_at`, for the same reasons as the digest
(`packages/domain/src/queries/list-digest-source-items.ts`): `published_at` is nullable
and carries bad rows, and email items have no published date. Disabled feeds are
excluded, as in `listAllRssItems`.

## Degraded Results

Neither LLM step can fail the request:

- Expansion fails, or no `ANTHROPIC_API_KEY`: retrieval runs on the description's words.
- Judgment fails (HTTP error, timeout, malformed or off-schema JSON, `refusal`,
  `max_tokens`), or no key: the top 10 candidates come back keyword-ranked with
  `reason: null` and `judged: false`. The page says "AI ranking unavailable".

Each failure logs `[history] <stage> failed` with the error object. A database error is
not an LLM failure and still propagates as a 500.

## Implementation Notes

### Stored search vectors

`rss_item.search_vector` and `email_item.search_vector` are stored generated tsvector
columns with GIN indexes, from migration `0020_add-item-search-vector.sql`: `title` (A),
`summary` (B) and the first 2000 characters of `content` (C) for RSS; `title` and
`email_subject` (A) and `description` (B) for email. The 2000-character cap keeps a vector
under Postgres's 1 MB tsvector limit.

They replaced a per-query `to_tsvector`, which measured 4.6–6.8 s for a 30-day window in
production and pushed searches past Bun's 10 s idle timeout.

The pinned toolchain cannot express them: drizzle-orm 0.30 has no `generatedAlwaysAs`, and
drizzle-kit 0.21 only emits btree indexes. So `0020` is a `drizzle-kit generate --custom`
migration (journaled, like `0013`'s HNSW index). The columns are not in the drizzle schema,
and `packages/domain/src/lib/history-candidates.ts` refers to them by name.
`tests/lib/history-candidates.test.ts` pins the weighting in the migration.

Each search logs `[history] retrieve=…ms expand=…ms judge=…ms candidates=N`.

### Server idle timeout

Both `apps/api` and `apps/www` set Bun's `idleTimeout` to 60 s. Bun's 10 s default closes
the connection on any response slower than that, and two sequential LLM calls can approach
it. www waits on the api, so its timeout must be at least as long.
