# API Architecture — CQRS + Separation of Concerns

## Directory Structure

```
apps/api/src/
  routes/         # Route definitions only
  validators/     # Zod schemas for request validation
  queries/        # Read operations (GET)
  commands/       # Write operations (POST, PATCH, DELETE)
  lib/            # Shared utilities (normalization, helpers)
  middleware/     # Hono middleware (auth, etc.)
```

## Routes

Route files define HTTP endpoints. They do three things:

1. Parse and validate the request (call validator)
2. Call the appropriate query or command
3. Return the response

Routes do NOT contain business logic, database queries, or data transformation.

```ts
// WRONG — route file doing everything
linksRoutes.post('/api/links', auth, async (c) => {
  const body = schema.safeParse(await c.req.json());
  // ...50 lines of db queries, tag normalization, joins...
  return c.json(result, 201);
});

// CORRECT — route delegates to validator + command
linksRoutes.post('/api/links', auth, async (c) => {
  const parsed = createLinkSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({error: 'Invalid request', details: parsed.error.flatten()}, 400);

  const result = await createLink(parsed.data);
  return c.json(result, 201);
});
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

One file per query. Pure function: takes typed params, returns typed result. Owns its database query logic.

```ts
// queries/list-links.ts
export async function listLinks(db: Database, params: ListLinksParams): Promise<ListLinksResult>
```

## Commands (Write)

One file per command. Pure function: takes typed input, performs the write, returns typed result. Owns its transaction logic.

```ts
// commands/create-link.ts
export async function createLink(db: Database, input: CreateLinkInput): Promise<LinkWithTags>
```

## Rules

- One query or command per file
- Queries never mutate; commands never return lists
- Shared logic (tag upsert, normalization) lives in `lib/`
- Database instance passed as first argument (not imported as module-level singleton)
- Route files import from validators/, queries/, commands/ — never from drizzle-orm directly
