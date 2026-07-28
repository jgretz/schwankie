# Error Handling — Total Best-Effort Wrappers

Extends, does not replace, the global `error-handling.md` ("Never Swallow Errors", "Catch Blocks", "API Clients"). Those rules govern errors you propagate; this one governs the narrow class of functions that promise never to propagate anything.

## The Rule

When a function's contract is "never throws" — a diagnostic writer, a failure-capture path, a cleanup hook, anything invoked from a `catch` block whose caller then rethrows the original error — the `try` must wrap the **entire function body**, from the first statement after destructuring to the last. Not just the risky I/O call.

The caller's shape is what makes this non-negotiable:

```ts
try {
  await promoteRssItem(id);
} catch (error) {
  await capturePromoteFailure({source: 'rss', sourceItemId: id, error});
  throw error; // never reached if the capture throws
}
```

Anything that escapes the wrapper propagates out of the caller's `catch` and **replaces the original error**. The diagnostic eats the diagnosis, which is the exact failure mode the `promote_failure` table was built to prevent.

## Why Helper Calls Are Not Safe

The statements that get left outside an under-scoped guard are the ones that look total. They are not:

- `String(error)` and template interpolation — `TypeError` on a null-prototype throwable. `Object.create(null)` has no `Symbol.toPrimitive`, no `toString`, no `valueOf`, so there is nothing to coerce.
- `JSON.stringify(error)` — `TypeError` on circular references, and on `BigInt` values.
- Property access such as `error.message` or `(error as {code?: unknown} | null)?.code` — an inherited getter is a function call and can throw anything. See `apps/api/src/lib/promote-error-code.ts`, which reads `.code` off an `unknown`.
- `console.error(...)` with an interpolated error — inherits every hazard above through its argument expressions, which are evaluated before the call.

Nothing in that list is I/O, which is why it reads as safe and gets hoisted above the `try`.

## Pattern

```ts
// WRONG — message extraction and the log line sit outside the guard, so a
// hostile throwable escapes and replaces the error the route is rethrowing
export async function captureFailure(input: CaptureInput): Promise<void> {
  const {source, sourceItemId, error} = input;

  const message = errorMessage(error); // throws on Object.create(null)
  console.error(`[promote] source=${source} message=${message}`, error);

  try {
    await recordPromoteFailure({source, sourceItemId, errorMessage: message});
  } catch (captureError) {
    console.error('[promote] failed to capture promote failure', captureError);
  }
}
```

```ts
// CORRECT — one guard opens as the first statement after destructuring and
// closes at the end of the body; every helper call is inside it
export async function captureFailure(input: CaptureInput): Promise<void> {
  const {source, sourceItemId, error} = input;

  try {
    const message = errorMessage(error);
    console.error(`[promote] source=${source} message=${message}`, error);

    await recordPromoteFailure({source, sourceItemId, errorMessage: message});
  } catch (captureError) {
    console.error('[promote] failed to capture promote failure', captureError);
  }
}
```

Leave a comment on the `try` saying why it is that wide. Otherwise the next reader "tidies" the cheap statements back above it.

## Required Test

Every never-throw wrapper carries a regression test that throws a hostile value at it and asserts the wrapper returns normally. A happy-path test cannot catch this — the under-scoped version passed every test it had.

```ts
it('should not throw on a throwable that resists stringifying', async function () {
  const hostile = Object.create(null);

  await capturePromoteFailure({source: 'rss', sourceItemId: 'item-id', error: hostile});

  expect(mockRecordPromoteFailure).toHaveBeenCalledTimes(0);
});
```

Both halves of the assertion matter. The absence of a throw proves totality. `toHaveBeenCalledTimes(0)` proves the guard fired early rather than silently writing a garbage row.

Live example: `apps/api/tests/routes/promote.test.ts`, `it('should not throw on a throwable that resists stringifying')`.

## Applies To

- `apps/api/src/commands/capture-promote-failure.ts` — the canonical implementation, correct as of #104. One `try` wraps the source-item lookup, `promoteErrorCode`, `errorMessage`, the log line, and the insert.
- Any future `capture-*` command or diagnostic writer under `apps/api/src/commands/` that a route calls from a `catch` block.
- Known at-risk sites, not yet guarded: `catch` blocks in `apps/tasks/src/scripts/phases` that coerce the caught value with `String(error)` — `apps/tasks/src/scripts/phases/feeds.ts:49` and `:54`, `apps/tasks/src/scripts/phases/rss-items.ts:83`, `apps/tasks/src/scripts/phases/email-items.ts:71`, `apps/tasks/src/scripts/phases/users.ts:46`, `apps/tasks/src/scripts/phases/links.ts:103`. Same hazard, and these are inside the `catch` itself, so the throw replaces the error being reported. Fixing them changes behavior and needs its own tests.
