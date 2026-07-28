# Link Metadata Extraction Architecture

## Context

Schwankie v5 needs to automatically extract metadata (title, description, image, tags, full-text content) when a link is added. The database schema already has fields for this (`title`, `description`, `imageUrl`, `content` in the `link` table), but no extraction logic exists. The task runner (`apps/tasks`) is stubbed out. No link CRUD API routes exist yet.

Goal: enrich links on save so the user can search effectively later. The `content` text field supports full-text search indexing.

## Two-Tier Extraction Strategy

### Tier 1 — Synchronous HTML Meta Parsing (~200ms)

Use **metascraper** with plugins to parse Open Graph, Twitter Cards, JSON-LD, and standard HTML meta tags. Covers ~85% of modern websites.

**Packages**: `metascraper`, `metascraper-title`, `metascraper-description`, `metascraper-image`, `metascraper-author`, `metascraper-date`, `metascraper-publisher`, `metascraper-url`

**Why metascraper over unfurl.js**: plugin architecture (add platform-specific extractors incrementally), you control the HTTP fetch (custom headers, redirects, timeouts), easier to extend, more actively maintained.

### Tier 2 — Async Full-Content Extraction (~3-5s per link)

Use **Cloudflare Browser Rendering REST API** `/markdown` endpoint for:

1. Links where Tier 1 failed (JS-rendered pages)
2. All links needing full-text content for the `content` field / FTS index
3. Run as background task in existing task runner (`apps/tasks`)

**Key endpoints**:

- `/markdown` — full page as markdown (ideal for `content` field)
- `/scrape` — extract elements via CSS selectors
- `/json` — AI-powered structured data extraction

**Cost**: Free tier = 10 min/day (~100-200 links/day at 3-5s each). Paid = $0.09/hour beyond 10 hours/month. No SDK needed — plain `fetch()`.

## Data Flow

```
Link saved
  → API fetches HTML via metascraper
  → Extract title/description/imageUrl
  → Save to database
  → Queue for Tier 2 enrichment
    ↓
  Task runner polls queue
    → CF Browser Rendering /markdown
    → Update content field
    → Mark link fully enriched
```

## Evaluated & Rejected Alternatives

- **CommonCrawl**: Data weeks/months stale, multi-step WARC fetch. Not real-time.
- **Microlink API**: 50 free requests/month unusable. $39/month for self-hostable capability.
- **Self-hosted headless browser**: Heavy ops, Chrome in production, no native Bun support.
- **unfurl.js**: Less extensible, no plugin system, bundles HTTP fetch internally.

## Schema Analysis

Current `link` table fields sufficient:

- `title` varchar(500)
- `description` varchar(800)
- `imageUrl` varchar(2048)
- `content` text

**Future migration** may add:

- `author` varchar(200)
- `publishedDate` timestamp
- `siteName` varchar(200)
- `contentType` varchar(100)

## Dependency Notes

### The `re2` override

`@metascraper/helpers` declares a hard dependency on `re2` (`~1.23.0`), a native NAN addon it passes to `url-regex-safe` for ReDoS-hardened URL matching. `re2` at `1.23.x` cannot compile against Node 26's V8 — its addon calls `v8::String::Utf8Length`, `v8::String::WriteUtf8`, and `v8::Context::GetIsolate`, all removed there — so on a machine with Node 26 the `node-gyp` fallback in `re2`'s install script fails and a from-scratch `bun install` exits non-zero. Nothing here loads `re2` at runtime: `METASCRAPER_RE2` is unset, so `url-regex-safe` falls back to plain `RegExp`.

The root `package.json` therefore carries `"re2": "^1.26.1"` in `overrides`, purely to keep `bun install` a clean signal. Drop it once `grep '"re2"' node_modules/@metascraper/helpers/package.json` shows a floor of `>= 1.24` — i.e. once `packages/metadata` moves to a metascraper release that no longer pulls an uncompilable `re2`.

Note that CI does not guard this: `.github/workflows/checks.yml` runs on `ubuntu-latest`, whose Node is old enough that even `re2@1.23.3` installs cleanly. The failure only reproduces on a from-scratch install under Node 26+.

## Implementation Roadmap (Future Tasks)

1. Create `packages/metadata` — metascraper extraction utility with typed output
2. Add link CRUD API routes with Tier 1 enrichment on create
3. Wire task runner to database, implement Tier 2 enrichment polling
4. Add CF Browser Rendering integration for `/markdown` content extraction
