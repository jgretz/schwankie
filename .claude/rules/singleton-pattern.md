# Singleton Pattern

## Existing Pattern

`packages/domain/src/db.ts` and `packages/client/src/config.ts` use module-level mutable singletons (`let x = null; init(); getX()`).

## Rules

### Export `reset()` for Test Isolation

Any `let x = null; init(); getX()` singleton MUST export a `reset()`:

```ts
export function reset(): void {
  instance = null;
}
```

Call `reset()` in `afterEach`. Without it, the first test to call `init()` poisons every subsequent test in the process.

### Prefer Dependency Injection

Pass dependencies as parameters rather than reaching for the module singleton:

```ts
// CORRECT — db passed explicitly, unit-testable
export async function upsertTags(db: DbLike, tags: string[]): Promise<void>;

// AVOID — coupled to module singleton
export async function upsertTags(tags: string[]): Promise<void> {
  const db = getDb(); // ...
}
```

The singleton pattern is acceptable at app entry points (server startup). Domain logic should accept dependencies as parameters.

### SSR Safety

Module-level `init()` calls run at import time during SSR — before any request arrives. Never call `init()` at module scope in server-rendered code unless the config is guaranteed available at module evaluation time. Prefer lazy initialization inside request handlers.

### Anti-Pattern: Silent Overwrite

`client/config.ts` has no guard — `init()` silently overwrites any previous config:

```ts
export function init(clientConfig: ClientConfig): void {
  config = clientConfig; // no guard — clobbers previous value
}
```

Calling `init()` twice with different configs (browser vs. server) silently uses whichever ran last. Add a guard or call `reset()` explicitly between uses.
