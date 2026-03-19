# Test Coverage

## Coverage Tiers

Coverage expectations vary by package role:

### Shared Packages — Full Coverage Required

- **`packages/domain`** — test all public exports with branching logic (queries, commands, lib utilities)
- **`packages/client`** — test each API call: success path, error path, non-ok HTTP response

### Utility Packages — Happy + Error Path

- **`packages/env`** — test valid env parse and missing/invalid key errors
- No need to test the Zod schema details, just that `parseEnv()` throws on bad input and returns the shape on good input

### App Packages — Pure Functions and Business Logic

- **`apps/api`** — test commands and queries in isolation; skip route handler tests (those test Hono internals)
- **`apps/www`** — test pure utility functions in `src/lib/`; skip component render tests

### Exempt

- **`packages/database`** — schema-only package; no logic to test

## Mock Integrity

Mock implementations must handle every operator or branch the real code exercises.

**The anti-pattern to flag:** a mock evaluator with a `default: return true` or a silent fallthrough on unrecognized input. This creates false confidence — tests pass not because the logic is correct, but because the mock ignores the condition.

```ts
// WRONG — silently passes on unrecognized operator
function evalCondition(op: string, a: number, b: number): boolean {
  if (op === 'eq') return a === b;
  if (op === 'lt') return a < b;
  return true; // ← bug: 'gte', 'ne', etc. always pass
}

// CORRECT — throw on unrecognized input so tests fail loudly
function evalCondition(op: string, a: number, b: number): boolean {
  if (op === 'eq') return a === b;
  if (op === 'lt') return a < b;
  if (op === 'gte') return a >= b;
  if (op === 'ne') return a !== b;
  throw new Error(`Unrecognized operator: ${op}`);
}
```

When reviewing a mock: search for `return true`, `return false`, or `return undefined` in branches that handle variable input — each is a candidate for a silent bug.

## Test Location

Tests live in `tests/` sibling to `src/`, mirroring the source structure:

```
packages/domain/
  src/
    lib/
      normalize-tags.ts
    queries/
      list-links.ts
  tests/
    lib/
      normalize-tags.test.ts
    queries/
      list-links.test.ts
```

A test for `packages/domain/src/lib/foo.ts` belongs in `packages/domain/tests/lib/foo.test.ts` — never in a consuming app's test folder.

## What to Test

See global `testing.md` for general patterns (structure, Arrange-Act-Assert, factories, mock-at-boundaries). The coverage tiers above define _which_ packages need coverage and at what depth.
