# API Auth — Per-Route Bearer Token Pattern

## How It Works

- `apps/api/src/middleware/auth.ts` exports `authMiddleware()` factory
- Each route file (`links.ts`, `tags.ts`, `settings.ts`, `metadata.ts`) calls `const auth = authMiddleware()` at module level
- Auth is passed as a route-level middleware argument only to endpoints that need it: `router.post('/path', auth, handler)`
- GET endpoints (reads) are public; POST/PATCH/DELETE (mutations) require auth

## Why Per-Route, Not Global

Hono's `app.use()` middleware applies only to routes registered _after_ the `.use()` call. If a router is mounted before the auth middleware, its routes are unprotected — silently. This ordering dependency is fragile and hard to audit.

Per-route auth is explicit: every protected endpoint visibly declares `auth` in its handler chain. No implicit ordering. No silent gaps. A code review can verify protection by reading the route definition alone.

## Pattern

```ts
import {authMiddleware} from '../middleware/auth';

const auth = authMiddleware();
const routes = new Hono();

// Public — no auth middleware
routes.get('/api/things', async (c) => { ... });

// Protected — auth middleware explicit
routes.post('/api/things', auth, async (c) => { ... });
routes.delete('/api/things/:id', auth, async (c) => { ... });
```

## Rules

- Never add global auth via `app.use('/api/*', authMiddleware())` — use per-route
- All mutation endpoints (POST, PATCH, PUT, DELETE) must include `auth` in the handler chain
- GET endpoints are public unless they return sensitive data (none currently do)
- When adding a new route file, instantiate `authMiddleware()` locally and apply per-route

## Existing Route Files

- `apps/api/src/routes/links.ts` — CRUD + refetch, suggest-tags, reset-enrichment
- `apps/api/src/routes/tags.ts` — rename, merge, normalize, delete
- `apps/api/src/routes/settings.ts` — get (public), put (protected)
- `apps/api/src/routes/metadata.ts` — fetch (protected)
