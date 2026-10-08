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

### No tsvector index

The search vector is computed per query: `title` (A), `summary` (B) and the first 2000
characters of `content` (C) for RSS; `title` and `email_subject` (A) and `description`
(B) for email. The window scan is bounded by `idx_rss_item_created_at` and
`idx_email_item_imported_at`.

A stored generated tsvector with a GIN index would be faster, but the pinned toolchain
cannot produce one: drizzle-orm 0.30 has no `generatedAlwaysAs` and indexes only plain
columns, and drizzle-kit 0.21 always emits a btree. It needs a hand-written migration
(precedent: `0013_add_link_embedding_hnsw_index.sql`) or a drizzle upgrade.

The cost was estimated, never measured: a 90-day worst case of several seconds. Each
search logs `[history] retrieve=…ms expand=…ms judge=…ms candidates=N`; if `retrieve`
regularly exceeds about 3 s in the Fly logs, add the index. The 2000-character content
cap also keeps any future stored vector under Postgres's 1 MB tsvector limit.
