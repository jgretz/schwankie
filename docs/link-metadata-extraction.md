# Link Metadata Extraction Architecture

<!-- Adding an incidental implementation note (dependency override, workaround, gotcha)? It goes in the top-level "## Implementation Notes" section — never nested under a tier/layer/phase heading. See .claude/rules/doc-structure.md. -->

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

## Implementation Notes

### `re2` is installed but never built

`@metascraper/helpers` declares a hard dependency on `re2` (`~1.23.0`), a native NAN addon it passes to `url-regex-safe` for ReDoS-hardened URL matching. Nothing here loads it: `METASCRAPER_RE2` is unset, so `helpers` passes `re2: false` and `url-regex-safe` uses plain `RegExp` (its `require('re2')` is inside a try/catch behind that flag). The addon is pure install-time cost, and compiling it is where the failures live:

- On a machine with Node 26, `re2@1.23.x` will not compile at all. Its addon calls `v8::String::Utf8Length`, `v8::String::WriteUtf8` and `v8::Context::GetIsolate`, all removed there.
- Under bun, the download step never even tries. `re2`'s install script shells out to `install-from-cache`, which locates the prebuilt artifact by reading `npm_package_repository_url`; bun points the `npm_package_*` variables at the workspace root, so the script logs `No github repository was identified` and falls through to `node-gyp -j max rebuild`. Every `bun install` therefore compiles RE2 from source.
- That source build then broke the EAS iOS build outright. `re2@1.26.1` depends on `node-gyp@^13`, whose bundled `undici` calls `webidl.util.markAsUncloneable`, absent from the Node 20.19.4 on EAS's macOS image. EAS runs `bun install --frozen-lockfile` from the repo root, so the mobile build paid for a native module that only the API and task runner even transitively reference, and died on it.

The root `package.json` therefore lists `trustedDependencies: ["esbuild"]`. Declaring the field at all replaces bun's default allow list of packages permitted to run install hooks, so `re2` is blocked and the build never happens, on any machine or CI image. `esbuild` is the only installed package whose hook must still run; `@biomejs/biome` and `es5-ext` were already blocked before this and are unaffected. `tests/trusted-dependencies.test.ts` pins the list, mirrors it against `bun.lock` (which is what `--frozen-lockfile` reads), and fails when a newly added dependency ships an install hook that nobody has classified.

`"re2": "^1.26.1"` stays in `overrides` as a second line of defense: it is what makes the package compilable under Node 26 if the hook is ever unblocked. Both can go once `grep '"re2"' node_modules/@metascraper/helpers/package.json` shows the dependency gone, i.e. once `packages/metadata` moves to a metascraper release that no longer pulls it.

CI does not reproduce any of this. `.github/workflows/checks.yml` runs on `ubuntu-latest`, whose Node is old enough that even `re2@1.23.3` builds cleanly, and it has no iOS job. The guard is the test, not the pipeline.

## Implementation Roadmap (Future Tasks)

1. Create `packages/metadata` — metascraper extraction utility with typed output
2. Add link CRUD API routes with Tier 1 enrichment on create
3. Wire task runner to database, implement Tier 2 enrichment polling
4. Add CF Browser Rendering integration for `/markdown` content extraction
