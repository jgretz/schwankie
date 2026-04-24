# Exploration & Inspiration Ideas

Parking lot for deferred ideas built on top of the relatedness primitive
(link embeddings + tag co-occurrence). Inspired by Atomic
(atomicapp.ai / kenforthewin/atomic), Recall.ai, and MyMind.

Everything here depends on `link_embedding` existing and being populated.

---

## Constellation view (`/explore` route)

Force-directed canvas over 200–500 saved links.

- **Library:** Sigma.js + Graphology (same stack Atomic uses).
- **Nodes:** saved links. Edges: top-K cosine similarity (K=3–5).
- **Encoding:** color = primary tag, size = score, opacity = recency.
- **Interactions:** click → inline preview + actions (re-queue, open, edit);
  hover → highlight neighborhood; search → dim non-matches.
- **Scale:** cap to ~1k nodes; stream more via zoom-level LOD if needed.

## "You also saved…" serendipity widget

Home/Compendium lands on a small panel that picks 3 random high-score
saved links and shows each with its 2 nearest neighbors. Regenerates on
refresh. Aims at emotion, not utility.

## Thematic clusters (auto-hierarchy)

Nightly batch: HDBSCAN over all embeddings; for each cluster pass the
top-10 representative links to Claude with "describe the theme in 2–5
words." Persist as a new `theme` + `link_theme` pair of tables (or just
reuse `tag` with a `source='auto-theme'` marker). Surface as a
second-axis navigation (`/themes/:slug`).

## Tag wiki synthesis

For any tag with ≥8 links, generate a Claude summary with inline link
citations. Cache in a new `tag_synthesis` table (or `setting` keyed by
tag slug). Refresh monthly or on user demand. Matches Atomic's wiki
feature. Highest delight, highest cost — leave for last.

## Semantic search (replace substring `q`)

Current `q` param does substring match on title/description. Replace
with vector-backed semantic search: embed the query, return links by
cosine similarity. Keep substring as fallback when embeddings missing.

## Promotion prioritization for RSS & email items

The similarity primitive extends beyond `link`. Score each `rss_item`
and `email_item` against the saved library before showing them in the
Feeds/Emails tabs. Items that look like things the user already keeps
bubble to the top; noise drops. Requires embedding the item
title + summary (cheap; nomic-embed-text is fast).

## Chunk-level embeddings

v1 uses one embedding per link over `title + description +
content[:8000]`. Long articles lose signal past 8k chars. Follow-up:
split content into ~1k-char chunks, embed each, use max cosine across
chunks for relatedness. Atomic does this per-chunk.

## Agentic chat / RAG over the library

"What did I save about X?" — vector search + Claude. Mirrors Atomic's
chat mode. Natural fit once semantic search exists.
