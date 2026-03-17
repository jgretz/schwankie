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
bun run dev:tasks           # Task runner

bun run typecheck           # Typecheck all
cd apps/www && bun run lint # Biome lint

cd packages/database
bun run generate --name <descriptive-name>  # drizzle-kit generate
bun run migrate                             # drizzle-kit migrate
```

## Apps

- **api** — Hono REST API (port 3001). Bearer auth middleware. Routes in `src/routes/`. Exports `fetch: app.fetch` for Bun server.
- **www** — TanStack Start + Vite + Tailwind. File-based routing in `src/routes/`. Do NOT edit `routeTree.gen.ts`.
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
