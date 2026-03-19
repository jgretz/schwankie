# API Architecture — CQRS + Separation of Concerns

## Directory Structure

Two-layer architecture: domain package owns data access (queries + commands), API app owns HTTP routing and orchestration commands that coordinate domain calls with external services.

```
packages/domain/src/
  queries/        # Read operations (one file per query)
  commands/       # Write operations (one file per command)
  lib/            # Shared logic (tag normalization, upsert helpers)
  types.ts        # Shared types (LinkWithTags, ListLinksParams, etc.)
  db.ts           # Database singleton init
  index.ts        # Public API barrel export

apps/api/src/
  routes/         # Route definitions only (HTTP → validator → query/command → response)
  validators/     # Zod schemas for request validation
  commands/       # API-level orchestration (composes domain calls + external services)
  middleware/     # Hono middleware (auth, etc.)
```

## Routes

Route files define HTTP endpoints. They do three things:

1. Parse and validate the request (call validator)
2. Call the appropriate query or command
3. Return the response

Routes do NOT contain business logic, database queries, or data transformation. Import queries and domain commands from `@domain`, and orchestration commands from local `../commands/`.

```ts
// WRONG — route file doing everything
linksRoutes.post('/api/links', auth, async (c) => {
  const body = schema.safeParse(await c.req.json());
  // ...50 lines of db queries, tag normalization, joins...
  return c.json(result, 201);
});

// CORRECT — route delegates to validator + domain command
linksRoutes.post('/api/links', auth, async (c) => {
  const parsed = createLinkSchema.safeParse(await c.req.json());
  if (!parsed.success)
    return c.json({error: 'Invalid request', details: parsed.error.flatten()}, 400);

  const db = getDb();
  const result = await createLink(db, parsed.data);
  return c.json(result, 201);
});

// Import patterns
import {createLink, listLinks} from '@domain';
import {refetchLink} from '../commands/refetch-link';
```

## Validators

One file per resource. Exports Zod schemas for each operation.

```ts
// validators/links.ts
export const createLinkSchema = z.object({ ... });
export const updateLinkSchema = z.object({ ... });
export const listLinksParamsSchema = z.object({ ... });
```

## Queries (Read)

Live in `packages/domain/src/queries/`. One file per query. Pure function: takes typed params, returns typed result. Owns its database query logic. Imported via `@domain` alias.

```ts
// packages/domain/src/queries/list-links.ts
export async function listLinks(db: Database, params: ListLinksParams): Promise<ListLinksResult>;
```

## Commands (Write)

Two layers:

### Domain Commands

Live in `packages/domain/src/commands/`. Pure data operations: create, update, delete, merge, rename. Imported via `@domain` alias.

```ts
// packages/domain/src/commands/create-link.ts
export async function createLink(db: Database, input: CreateLinkInput): Promise<LinkWithTags>;
```

### API Orchestration Commands

Live in `apps/api/src/commands/`. Compose domain calls with external services (Jina content fetch, Anthropic tag suggestion, metadata extraction). API-specific and not reusable outside the API app.

```ts
// apps/api/src/commands/refetch-link.ts
export async function refetchLink(
  db: Database,
  linkId: string,
  jinaClient: Jina,
  anthropicClient: Anthropic,
): Promise<LinkWithTags>;
```

## Rules

- One query or command per file
- Queries never mutate; commands never return lists
- Shared logic (tag upsert, normalization) lives in `packages/domain/src/lib/`
- Database instance passed as first argument (not imported as module-level singleton)
- Route files import from validators/, @domain (for queries and domain commands), and local ../commands/ (for orchestration commands)
- Domain queries and commands live in `packages/domain` — not in `apps/api`
- API orchestration commands compose domain operations with external services and live in `apps/api/src/commands/` only
