# Batch Processing — Error Isolation and Silent Death Prevention

## Error Isolation

Sequential jobs in a batch pipeline must be independent. One job failing must not skip the rest.

**Wrong** — `enrichContent` throwing kills `scoreLinks` and `normalizeTags`:

```ts
async function poll() {
  await enrichContent();
  await scoreLinks();
  await normalizeTags();
}
```

**Correct** — each job is isolated; all jobs run regardless of individual failures:

```ts
const jobs = [
  {name: 'enrichContent', fn: () => enrichContent()},
  {name: 'scoreLinks', fn: () => scoreLinks()},
  {name: 'normalizeTags', fn: () => normalizeTags()},
];

async function poll() {
  for (const job of jobs) {
    try {
      await job.fn();
    } catch (error) {
      console.error(`[poll] ${job.name} failed:`, error);
    }
  }
}
```

Log the full error object — never swallow it silently or replace it with a generic message.

## Silent Death Prevention

A `setTimeout`-based polling loop dies silently if the poll body throws after the initial call. No crash, no log, no restart — the process keeps running but does nothing.

**Wrong** — unhandled throw kills the loop with no signal:

```ts
async function scheduleNext() {
  await poll();
  setTimeout(scheduleNext, INTERVAL);
}
```

**Correct** — top-level catch ensures the loop always reschedules:

```ts
async function scheduleNext() {
  try {
    await poll();
  } catch (error) {
    console.error('[scheduleNext] Unexpected poll failure:', error);
  } finally {
    if (running) setTimeout(scheduleNext, INTERVAL);
  }
}
```

## Applies To

- Task runners (`apps/tasks`)
- Cron-like sequential pipelines
- Any `for` loop over independent async operations
- Recursive `setTimeout` / `setInterval` polling loops
