# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Schwankie v5 — a "second memory" link store at https://www.schwankie.com. Bun monorepo.

## Commands

```bash
bun install                 # Install deps (from root)
bun run dev                 # www (3000) + api (3001)
bun run dev:api             # API only (port 3001)
bun run dev:www             # WWW only (port 3000)
bun run dev:mobile          # Expo CLI (iOS sim)
bun run dev:tasks           # Task runner

bun run typecheck           # Typecheck all
bun run typecheck:mobile    # Typecheck mobile only
cd apps/www && bun run lint # Biome lint

bun run test                    # all packages (per-package processes)
bun run test:isolated           # all packages, one process (--isolate)
bun test --cwd packages/domain  # one package

cd packages/database
bun run generate --name <descriptive-name>  # drizzle-kit generate
bun run migrate                             # drizzle-kit migrate
```

Never run a bare `bun test` from the repo root — it reports ~200 phantom failures.
bun reads `bunfig.toml` only from the cwd, so the per-package `[test] preload` entries
are skipped, and `mock.module` registers process-globally, so `apps/api`'s partial
`@domain` stubs leak into `packages/domain`'s tests. See `docs/testing.md`.

## Apps

- **api** — Hono REST API (port 3001). Bearer auth middleware. Routes in `src/routes/`. Exports `fetch: app.fetch` for Bun server.
- **www** — TanStack Start + Vite + Tailwind. File-based routing in `src/routes/`. Do NOT edit `routeTree.gen.ts`.
- **mobile** — Expo Router (SDK 55, React 19, RN 0.83). Tabs: Queue, Feeds, Emails, Settings. Init client with `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_API_KEY` env vars.
- **tasks** — Bun polling task runner.

## Packages

- **client** — Shared API client. `init({apiUrl, apiKey?})` singleton, one file per call in `src/calls/`.
- **database** — Drizzle ORM + PostgreSQL. Schema in `schema/`. `createDatabase()`.
- **env** — Zod env parsing via `parseEnv()`.

## Key Patterns

- **Path Aliases**: tsconfig aliases — `database`, `env`, `client`, `@domain`, `@api`, `@www/*`.
- **API Client**: Shared `client` package. `init()` singleton pattern (like `domain`). One call per file.
- **Design System**: Stone & Slate theme (slate-blue accent `#5b6f8a`). CSS custom properties for colors. Light/dark toggle with localStorage persistence. Lora (serif) for headings/titles, DM Sans for UI chrome.

## Prettier

Config in `.prettierrc`: single quotes, semicolons, trailing commas, no bracket spacing, 100 char width.
