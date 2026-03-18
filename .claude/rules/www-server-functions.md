# www — Server Functions for Auth-Protected API Calls

## The Problem

The `client` package's `init()` in the browser does NOT include an API key.
Only `initClientServer()` (server-side) injects the API key via env. Any
auth-protected API endpoint called directly from the browser will 401.

## The Rule

**All write operations (POST, PUT, PATCH, DELETE) from the www app MUST go
through a `createServerFn` wrapper** — never call the client function directly
from a component or hook.

Read operations (GET) to public endpoints can use the client directly with
`initClient()` at module level.

## Pattern

Create a `*-actions.ts` file in `apps/www/src/lib/`:

```ts
import {createServerFn} from '@tanstack/react-start';
import {z} from 'zod';

async function requireAuth() {
  const {getSession} = await import('./session.server');
  const session = await getSession();
  if (!session?.authenticated) {
    throw new Error('Unauthorized');
  }
}

async function getClient() {
  const {initClientServer} = await import('./init-client.server');
  initClientServer();
}

const myInput = z.object({id: z.number()});

export const myAction = createServerFn({method: 'POST'})
  .inputValidator(myInput)
  .handler(async ({data}) => {
    await getClient();
    await requireAuth();
    const {myClientCall} = await import('client');
    return myClientCall(data.id);
  });
```

Then call from hooks/components: `myAction({data: {id: 123}})`.

## Existing Action Files

- `link-actions.ts` — create, update, delete, refetch, suggest tags for links
- `settings-actions.ts` — update settings
- `tag-actions.ts` — rename, merge, delete tags

## Checklist for New Client Calls

1. Is the API endpoint auth-protected? → Server function required
2. Is it a write operation? → Server function required
3. Is it a public GET? → Direct client call with `initClient()` is fine
