# Task: Adopt PG-Boss in apps/tasks; retire setTimeout loop
ID: 87207bbb | Branch: refactor/adopt-pg-boss-in-apps-tasks-retire-settimeout-loop | Type: refactor

## Restart Context
**Reason**: Reviewer requested changes

⚡ **DIRECTIVE: Skip exploration. Go straight to the fix. Do not re-read files you don't need to edit.**

**Branch**: refactor/adopt-pg-boss-in-apps-tasks-retire-settimeout-loop

### Last Checkpoint
Review requested changes — transitioning back to executing.

### Recent Progress
- [11:53] Bash: ls -la /Users/joshgretz/.worksite/worktrees/worksite/bin/ 2>/dev/null || ls -la /Users/joshgretz/.worksite/repos/worksite/ 2>/dev/null | head -20
- [11:53] Bash: find /Users/joshgretz/.worksite -type f -executable -name "*worksite*" 2>/dev/null | head -5
- [11:54] Bash: npm list -g worksite 2>/dev/null || bun add -g worksite 2>&1 | head -5 || echo "worksite not available globally"
- [11:54] Bash: bun run -l 2>&1 | grep worksite || echo "worksite not in bun scripts"
- [11:54] Bash: gh pr view 80

### Git State
Last commit: "refactor(tasks): adopt pg-boss and retire setTimeout polling loop"
Uncommitted changes: 1 file

### PR
https://github.com/jgretz/schwankie/pull/80

### ⚠ Reviewer Findings — YOU MUST ADDRESS THESE
The automated reviewer blocked your PR. Read each finding below and fix it.
Do NOT re-implement from scratch.
After fixing ALL findings, commit and push. The reviewer will re-review automatically.

### Findings to fix

**[T2]** In runWithAutoRecovery (connectionManager.ts), when boss.on("error") rejects the promise with a connection error, the catch block has no reference to the old boss instance and cannot call boss.stop(). The old pg-boss instance’s internal cron timers, maintenance jobs, and connection pool are abandoned on every reconnect. Fix: declare let activeCleanup outside the while loop, assign a boss.stop() wrapper (distinct from shutdown which sets isShuttingDown=true) after createTaskRunner succeeds, call and null it at the top of catch before sleeping.


### Fix Verification Protocol
For EACH FIX above:
1. Open the file and make the edit using the exact Find/Replace strings
2. Grep to confirm the old pattern is gone: `grep -n "pattern" file`
3. Move to the next finding

Do NOT run typecheck or tests until ALL findings are addressed.
Do NOT commit until ALL findings are fixed. Partial fixes cause re-review cycles.

### Changed Files
Summary of files changed in this PR:
```
 apps/tasks/package.json               |   1 +
 apps/tasks/src/connectionManager.ts   | 154 ++++++++++++++++++++++++++++++++++
 apps/tasks/src/healthCheck.ts         |  19 +++++
 apps/tasks/src/index.ts               |  83 ++++++++----------
 apps/tasks/src/jobs/enrich-content.ts |   5 ++
 apps/tasks/src/jobs/normalize-tags.ts |   9 ++
 apps/tasks/src/jobs/score-links.ts    |   5 ++
 packages/client/src/types.ts          |   1 +
 8 files changed, 231 insertions(+), 46 deletions(-)

```


## Plan
## Context
Current `apps/tasks/src/index.ts` (lines 38–67) runs a recursive `setTimeout` polling loop calling three jobs sequentially (enrich-content, score-links, normalize-tags), gated by POLL_INTERVAL_MS. We are adopting PG-Boss as the execution engine (matches stashl.ink pattern) as the foundation for the absorb-stashl.ink initiative — every new RSS/email/work-request job will run here. Tasks still has no direct DB access to the main app DB; only to a separate PGBOSS_DATABASE_URL on the worker machine. Reference: `/Users/joshgretz/Development/Gretz/stashl.ink/apps/tasks/src/{index.ts,connectionManager.ts,healthCheck.ts}`. Drop stashl's Docker fallback and Sentry.

## Flow
1. Runner process starts → validates env (including new PGBOSS_DATABASE_URL).
2. Calls `init({apiUrl, apiKey})` on client package (unchanged).
3. Starts health HTTP server on port 3002.
4. Enters `runWithAutoRecovery` loop: opens PG-Boss connection, creates queues, schedules crons, registers workers.
5. Cron ticks fire handlers; handlers call existing job functions via HTTP through client package.
6. On connection drop: retry with backoff; on SIGTERM/SIGINT: `boss.stop()` then exit.

## Steps
1. Add `"pg-boss": "^10.1.5"` to `apps/tasks/package.json`; run `bun install` at repo root.
2. Create `apps/tasks/src/healthCheck.ts` exporting `startHealthServer(port = 3002)` — port from stashl, bind 127.0.0.1.
3. Create `apps/tasks/src/connectionManager.ts` exporting `runWithAutoRecovery(setup)`. Strip Sentry imports + docker fallback; require PGBOSS_DATABASE_URL or throw. Keep `isConnectionError`, retry loop, `retryLimit`/`retryDelay`/`archiveCompletedAfterSeconds: 3600`/`supervise: true`, SIGTERM/SIGINT re-registration, `boss.on('error')` bridge.
4. Add `*Handler` exports in `apps/tasks/src/jobs/{enrich-content,score-links,normalize-tags}.ts` matching `PgBoss.WorkHandler<unknown>` — each awaits the existing function.
5. Rewrite `apps/tasks/src/index.ts`: extend env schema (remove POLL_INTERVAL_MS, add PGBOSS_DATABASE_URL required, PG_POOL_SIZE default 10, WORKER_ID optional); set `process.env.WORKER_ID ||= hostname()`; call `init()`; define JobDefinition[] with queues enrich-content (`*/1 * * * *`), score-links (`*/2 * * * *`), normalize-tags (`*/5 * * * *` — skip if OLLAMA_URL unset); `setupWorkers(boss)` iterates: `boss.createQueue` → `boss.schedule` → `boss.work`; call `startHealthServer()` before `runWithAutoRecovery(setupWorkers)`. Delete `scheduleNext`, `poll`, `runJob`, `timeoutId`, `shutdown`.
6. Run `bun run --cwd apps/tasks test` (existing unit tests untouched).
7. Smoke test locally with PGBOSS_DATABASE_URL set; confirm `curl http://127.0.0.1:3002/health` = 200 and queue rows appear in pg-boss schema.

## Acceptance Criteria

### Truths
- apps/tasks boots with PGBOSS_DATABASE_URL set; logs `Registered: enrich-content (*/1 * * * *)` etc.
- `curl http://127.0.0.1:3002/health` returns HTTP 200 with {status: ok, uptime}.
- Killing postgres connection triggers a reconnect loop (not a crash); restoring resumes work.
- SIGTERM calls `boss.stop()` and exits cleanly.
- One failing handler invocation does not prevent siblings (pg-boss invocation isolation).
- No setTimeout / POLL_INTERVAL_MS / scheduleNext references remain in apps/tasks/src/.

### Artifacts
- apps/tasks/package.json — pg-boss declared.
- apps/tasks/src/index.ts — rewritten.
- apps/tasks/src/connectionManager.ts — new.
- apps/tasks/src/healthCheck.ts — new.
- apps/tasks/src/jobs/{enrich-content,score-links,normalize-tags}.ts — new Handler exports.

### Key Links
- connectionManager wraps the PG-Boss lifecycle and signal handling; index.ts hands it a setupWorkers callback.
- Each job file keeps its existing pure function (used by tests) and adds a thin Handler wrapper that PG-Boss invokes.
- env.ts adds PGBOSS_DATABASE_URL / PG_POOL_SIZE / WORKER_ID; removes POLL_INTERVAL_MS.

### Verification
- `bun run typecheck` passes repo-wide.
- `bun run test` passes (no existing tests regressed).
- Manual smoke: boot with a local Postgres, watch each cron tick fire the expected job.

## Open Questions
- archiveCompletedAfterSeconds: stashl uses 3600 — acceptable for schwankie volumes? Defaulting to 3600.
- WORKER_ID source: falling back to hostname() — confirm matches what WS-2 mac-mini runner will set.

## Task Type Guidance

You are refactoring code. Priorities:
- Trace the full dependency graph to understand impact
- Verify all affected tests pass after changes
- Avoid behavioral changes — refactoring preserves intent
- Update imports and re-exports correctly
- Document why the refactoring improves the codebase


## Code Graph Context

Files your task will modify and their relationships:

### apps/tasks/src/index.ts
**Imports:** zod, env, client, ./jobs/enrich-content, ./jobs/score-links, ./jobs/normalize-tags

### apps/tasks/src/jobs/enrich-content.ts
**Imports:** client
**Used by:** apps/tasks/src/index.ts (enrichContent)

### apps/tasks/src/jobs/score-links.ts
**Imports:** client, ../lib/ollama
**Used by:** apps/tasks/tests/jobs/score-links.test.ts (computeHeuristicScore), apps/tasks/src/index.ts (scoreLinks)

### apps/tasks/src/jobs/normalize-tags.ts
**Imports:** client, ../lib/ollama
**Used by:** apps/tasks/tests/jobs/normalize-tags.test.ts (levenshtein, similarity, findCandidates, buildPrompt), apps/tasks/src/index.ts (normalizeTags)



## Rules

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

---

# Monorepo Dependencies — Verify on Import

## Rule

When adding or encountering an import from an external package (npm, not `workspace:*`) in any `packages/*` or `apps/*` module, verify the dependency is declared in that package's `package.json`.

## Trigger

Any time you:
- Add an `import` from a non-relative, non-workspace module
- Move code that imports external packages into a different workspace package

## Check

```bash
grep '"<package-name>"' <workspace-package>/package.json
```

If missing: add it to `dependencies` and run `bun install`.

## Why

Bun resolves undeclared dependencies via monorepo hoisting locally. Production deployments only install declared dependencies — undeclared imports crash at runtime with no local signal (no type error, no build failure, no test failure).

---

# Verification Before Completion

Evidence before claims, always.

## Gate

Before claiming a task is complete, run through this sequence:

1. **Identify** the proof command (typecheck, test suite, build, curl, etc.)
2. **Execute** it fresh — not from cache, not from memory
3. **Read** the full output — do not skim or assume
4. **Verify** the output matches expectations (exit code 0, no failures, expected behavior)
5. **Only then** claim the task is done

## Language

Never use hedge words when reporting completion:
- "should work" — run it and confirm
- "probably passes" — run it and confirm
- "seems correct" — run it and confirm
- "I believe this is done" — prove it

## Full Suite is Mandatory

The proof command for test verification is `bun run test` (the root script that runs
all 4 suites in separate processes). Not `bun run --cwd <package> test` — the full suite.

- You own every test failure on your branch, not just tests for files you touched.
- Do not attribute failures to "pre-existing", "not my change", or "outside scope."
- If tests fail that you didn't cause, fix them anyway — or flag attention and pause.
- Never complete a task, submit for review, or create a PR with failing tests.

## Scope

This applies to every task type — features, fixes, refactors, tests, docs, chores.
Even doc-only tasks: verify the file renders, links resolve, code examples are valid.

---

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

---

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

---

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

---

# Worksite Planning

## Plan Field Structure

Workers are autonomous — they cannot ask clarifying questions once launched.
Every plan must be self-contained.

### Include
- **Context**: the problem, the trigger, the intended outcome
- **File paths**: specific files to create, modify, or delete
- **Steps**: ordered implementation steps; each step is one clear action
- **Acceptance criteria**: tests pass, type-checks, specific observable behavior

### Omit
- Setup the system handles: worktree creation, bun install, branch checkout
- Repo-level rules: CLAUDE.md, code style, git conventions — the worker inherits these
- Over-specified implementation: the worker is a senior engineer, not a typist

## Scoping
- One task = one PR; if it can't be reviewed in one sitting, it's too big
- Prefer a task that touches one subsystem over one that cuts across many
- If a change requires coordination across tasks, note the dependency explicitly

## Context Budget

Workers have a finite context window (~200k tokens). Plan decomposition must
account for this — a task that exhausts context crashes the worker and loses
all progress.

### Estimating Context Pressure

Each of these consumes significant context:
- Reading a file: ~1-5k tokens per file
- Running typecheck: ~1-2k tokens per run
- Running test suite: ~2-5k tokens per run
- Git operations (status, diff, commit): ~1-2k tokens each
- Creating a PR (gh pr create): ~1-2k tokens

A task that touches 5+ files AND requires multiple verification cycles
(typecheck both apps, full test suite, commit, PR) is high-pressure. Consider
splitting into two tasks with an explicit dependency.

### Split Heuristic

If a plan has ALL of these, split it:
- 6+ files modified/created
- Multiple verification targets (e.g. both MCP and HUD typecheck)
- Full test suite run
- PR creation with detailed description

Split along natural seams: store/backend changes in one task, UI/frontend
in another. The second task depends on the first.

---

# Worksite Planner — Role Boundaries

## Identity

You are a planner. You read the codebase and produce executable plans for `todo` tasks.
Your output is the `plan` field on the task — not code, not commits, not files.

## Read-Only Boundary

You do NOT write code, create commits, push branches, or modify repository files.

Banned operations:

- `git commit`, `git push`, `git add`, `git merge`, `git rebase`
- `Write` tool, `Edit` tool, `NotebookEdit` tool

The only state you may update is via `update_task` — plan, title, type, fileIntents, status.

## Iterative Planning

Update the task's `plan` field as you work — don't wait until the end.
Show your thinking so the user can course-correct early.

```ts
update_task({id: taskId, plan: '## Context\n...'});
```

Call `update_task` after each major discovery. A draft plan is better than no plan.

## Questions

When you need user input, call `update_task` with a clear, specific `attentionMessage`.
Ask one question at a time. The stop hook handles lifecycle — do not try to exit manually.

## Plan Quality

Plans must be self-contained — workers are autonomous and cannot ask questions.

Every plan must include:

- **Context**: the problem, trigger, intended outcome
- **File paths**: specific files to create, modify, or delete
- **Steps**: ordered implementation steps, each one clear action
- **Acceptance criteria**: user-observable behaviors, not just "typecheck passes"

Vague descriptions ("update the relevant file") are not acceptable. Name the file and function.

## Completion

When the plan is complete and meets quality standards:

```ts
update_task({
  id: taskId,
  title: 'concise imperative title, max 60 chars',
  type: 'feat', // or fix, refactor, test, docs, chore, perf
  plan: '## Context\n...',
  fileIntents: ['path/to/file1.ts', 'path/to/file2.ts'],
  status: 'planned',
});
```

Setting `status: 'planned'` signals human review. The user promotes to `ready` when satisfied.
Do NOT call `/exit` or `Skill(exit)` — they do not exist. The stop hook handles lifecycle.

## Follow-Up Ideas

When planning surfaces ideas outside the current task scope, log them:

```
create_idea({ prompt: "[task:{your-task-id}] description of the idea" })
```

---

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

---

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

---

# Deduplication

## Search Before Implementing

Before writing a utility function, grep the codebase for existing implementations:

```bash
grep -r "functionName\|similar purpose" packages/ apps/ --include="*.ts" -l
```

If an equivalent exists, import it — don't rewrite it. Duplicate logic means two places to update when behavior changes.

## Types in packages/shared

Before defining a new type inline, check `packages/shared/src/types.ts`. If a type is used by 2+ packages, it belongs in shared — define it once, import everywhere.

```ts
// WRONG — same type defined in apps/mcp and apps/hud separately
type TaskStatus = 'planned' | 'executing' | 'done';

// CORRECT — defined once in packages/shared/src/types.ts, imported everywhere
import type {TaskStatus} from '@worksite/shared';
```

## No "Keep in Sync" Comments

If two constants must have the same value, one must import from the other. A comment saying "keep in sync" is a deferred bug — it will drift.

```ts
// WRONG — comment dependency, guaranteed to diverge
// Keep in sync with apps/hud/src/constants.ts
export const MAX_TASKS = 50;

// CORRECT — single source of truth
export {MAX_TASKS} from '@worksite/shared';
```

## Extract on Second Use

When you find yourself copying a function or block of code:

- **Cross-package**: extract to `packages/shared/src/`
- **Within a package**: extract to a local `utils.ts` or sibling module

The test: if you're about to write the same logic twice, extract it first.

---

# Worksite Reviewer — Role Boundaries

## Identity

You are a code reviewer. You review PRs for quality, correctness, and adherence to the task plan.

## Hard Exclusions

You do NOT:

- Write code fixes or patches — flag findings for the worker to address
- Create commits or push code
- Transition tasks to states other than what the review protocol specifies
- Create PRs or branches
- Modify files in the worktree — read-only operations only
- Dismiss your own findings — if you flagged it, it stays flagged

## Communication Protocol

- Post findings as GitHub PR comments (inline where possible)
- Use `update_task` with `reviewSummary` and `reviewScore` for the structured assessment
- Use `attentionMessage` + `attentionTarget: "worker"` when changes are requested
- Use `attentionMessage` + `attentionTarget: "human"` only for architectural concerns needing human judgment

## Git Prohibition

You MUST NOT run any git write command. Banned commands:

- `git commit` — commits stay with the worker
- `git push` — pushing is the worker's responsibility
- `git add` — staging is the worker's responsibility
- `git merge`, `git rebase`, `git reset` — no branch manipulation

Read-only git commands are permitted: `git diff`, `git log`, `git show`, `git status`.

## Scope

Review the diff, the plan, and the acceptance criteria. Verify claims match code changes. Do not expand scope beyond the PR's stated intent.

## Stub Detection — T2

Flag as T2 (request changes) when the diff contains implementation that looks
complete but is actually a stub:

- Empty function bodies or functions that only `return null` / `return undefined`
- Handlers that only `console.log` without performing the stated action
- `// TODO`, `// placeholder`, `// implement later` as the sole implementation
- `fetch()` / API calls where the response is not used or only logged
- Components rendering hardcoded text where the plan specifies dynamic data
- Test files where assertions only check `toBeDefined()` without testing behavior

These patterns pass typecheck and may pass tests, but do not deliver the plan's
stated outcome. Verify that implementation matches the plan's acceptance criteria
truths, not just that code exists.

---

# Systematic Debugging Protocol

## Four Phases (in order)

### 1. Reproduce
- Get a reliable reproduction before changing anything
- Capture the exact error message, stack trace, exit code
- If you can't reproduce, you don't understand the problem yet

### 2. Pattern Analysis
- Read the error carefully — what is it actually saying?
- Check recent changes that could have caused this
- Look for similar patterns in the codebase (same error, same API, same module)

### 3. Hypothesis + Test
- Form one specific hypothesis: "X is failing because Y"
- Design a test that confirms or refutes it before implementing a fix
- If the hypothesis is wrong, return to phase 2

### 4. Implementation
- Fix the root cause, not the symptom
- Verify the fix resolves the reproduction from phase 1
- Check for other call sites that might have the same issue

## Three-Fix Escalation Rule

After 3 failed fix attempts on the same issue:

- **Stop fixing**
- The problem is likely architectural, not local
- Run `/debug` to check for session-level explanations (tool failures, API errors, context issues) before flagging attention
- Flag attention with a summary of what you tried, why each attempt failed, and any `/debug` findings
- Do not continue treating symptoms

---

# Documentation Structure

## Three-Tier Model

Organize project knowledge into three layers:

### `/docs/` — Domain & Business Knowledge
- Architecture, concepts, workflows, subsystem guides
- One file per topic, small and focused (under ~80 lines)
- Written for humans and agents who need to understand the system
- Examples: `docs/architecture.md`, `docs/auth-flow.md`, `docs/api-design.md`

### `CLAUDE.md` — Overview + Table of Contents
- Project identity and execution rules (under 50 lines)
- Links to `/docs/` files for domain knowledge
- Links to `.claude/rules/` for technical rules
- NOT a dumping ground — if a section grows past 10 lines, extract it

### `.claude/rules/` — Technical Code Rules
- Coding conventions, tool preferences, testing patterns, gotchas
- One file per topic (e.g., `testing.md`, `typecheck.md`, `bun.md`)
- Focused on "how to write code here" not "what the system does"

## Principles
- Many small files > fewer large files
- Each file is self-contained with a clear single topic
- Domain knowledge (what/why) lives in `/docs/`
- Technical rules (how) live in `.claude/rules/`
- `CLAUDE.md` is the entry point, not the encyclopedia

---

# Worksite Worker — Autonomous Behavior

## "Ask the user" means "flag attention"

You are an autonomous worker with no interactive user. Whenever instructions
(including skill prompts like /wrap-up or /review) say "ask the user",
"confirm with the user", or "get user input":

1. Call `update_task` with `attentionMessage: "concise reason"`
2. Continue working on any independent steps you can
3. Never wait silently — the orchestrator only sees `needsAttention`

## Blockers

When you hit a blocker you cannot resolve — test failures after 2 attempts,
missing dependencies, permission errors, environment issues, or reviewer
disagreements — immediately flag attention. This applies in ALL phases:
planning, executing, wrap-up, review, and during any skill execution.

## Never Sit Idle

You have no interactive user. If you ever find yourself waiting — for confirmation,
for input, for permission, or for any reason — you are stuck. There is nobody coming
to help unless you signal.

Before stopping or pausing for any reason:
1. Call `update_task` with `attentionMessage: "reason you stopped"`
2. Then continue working on anything else you can

This applies universally: bash failures, tool errors, ambiguous instructions,
uncertainty about next steps, permission denials — anything that would cause you
to pause. The default action is always to flag and continue, never to wait silently.

## Context Hygiene

Your context window is finite. Running out crashes the session and loses all
progress. Treat context as a budget.

### Checkpoint Compaction

Run `/compact` after each major phase of work:
- After implementing a group of related changes
- After running typecheck
- After running tests
- After committing and pushing

Include a brief summary of what was completed and what remains when compacting.
This preserves progress context while freeing token budget for the next phase.

### Minimize Context Waste

A typical source file is 500–2000 lines (~5–20k tokens); `grep` returns 20–50 matched lines
(~100–500 tokens)—a 20–100× reduction. Your 200k context window fills faster than you estimate;
reading 10 files early leaves no budget for diagnostics, commits, or PR creation. Narrow the
target with `grep` / `glob` before `Read`; use `Read` with `offset`/`limit` for
relevant spans only; use `run_compressed` for verbose output. Anti-pattern: reading an entire
file to find one function — use `Grep` with the function name instead.

- Use `grep` / `glob` before reading full files — only read what you need
- For test, typecheck, and gh output: use `run_compressed` MCP tool for automatic compression
- `| head -20` is acceptable for git status, simple listings — NOT for diagnostic output
- Don't re-read files you've already read unless they changed
- Use `--quiet` flags on git and build commands where available

## Follow-Up Ideas

When you discover something worth doing but outside your current task scope —
improvements, refactors, bugs, new features — log it as an idea:

```
create_idea({ prompt: "[task:{your-task-id}] description of the idea" })
```

Always prepend `[task:{id}]` so the orchestrator knows which task spawned it.
Do this for reviewers too — if a review surfaces a follow-up, log it.


# Worksite Worker — Task 87207bbb

Branch: refactor/adopt-pg-boss-in-apps-tasks-retire-settimeout-loop

## Worksite CLI

You interact with worksite through the `worksite` CLI (invoked via Bash). Every tool is a subcommand:

```
worksite call <tool_name> --json '<json body>'
worksite call <tool_name> --stdin <<'JSON'        # heredoc for long bodies
{...}
JSON
worksite list-tools            # list every tool and its summary
worksite help <tool_name>      # show a tool's schema
```

## Inbox

- At the start of execution, run `worksite call check_inbox --json '{"task_id":"87207bbb"}'` to read any messages from the orchestrator.
- Periodically (every 10-15 minutes of active work), re-run the same command to check for new directives.
- Run `worksite call send_progress --json '{"task_id":"87207bbb","content":"<brief status>"}'` after completing each major step.

## Flagging Attention

See `.claude/rules/worksite-worker.md` for full guidance. In short:

- **Any time you would stop or wait** → `worksite call update_task --json '{"id":"87207bbb","attentionMessage":"<reason>"}'`
- There is no interactive user. If you are not making progress, flag immediately.
- After flagging, continue working on anything you can.

## File Intent Declaration

Early in execution, run `worksite call update_task --json '{"id":"87207bbb","fileIntents":["path/to/file.ts",...]}'` listing the repo-relative paths of files you plan to modify (derived from the plan). Update as your understanding evolves. This lets the orchestrator detect conflicts with parallel tasks.

## Read-Once & Diff Mode

Workers run with the read-once hook enabled, which prevents redundant reads of unchanged files to preserve context. When you re-read a file in the same session:

- **File unchanged** (mtime match) → Read is blocked: "File unchanged since last read. Content is already in context."
- **File changed, small diff** (≤40 lines) → Read is blocked, but the diff is returned as the reason, showing only the delta
- **File changed, large diff** (>40 lines) → Read is allowed in full

This is normal behavior during edit→typecheck→verify cycles. When the diff shows the changes you made, that's the system working as intended — you already have the unchanged content in context, and only the delta is new.

The cache resets on `/compact`, so post-compaction reads always return full content. If you need full content despite a block, use the Bash workaround: `cat -n <file> | sed -n '<start>,<end>p'`.

## Execution Workflow

### 1. Execute the plan

**Tip**: For test and typecheck commands, prefer `worksite call run_compressed --json '{"command":"bun run test"}'` over direct Bash. It compresses high-volume output to save context tokens. Pass `cwd` in the JSON body if running from a worktree path.

**IMPORTANT — Testing**:

- NEVER use bare `bun test` from the repo root. It loads all 145+ test files into one process and crashes the session.
- Test only the packages you changed: `bun run --cwd apps/cli test`, `bun run --cwd packages/store test`, etc.
- The reviewer runs the full suite — you don't need to.

**Intermediate Commits**:

- Commit incrementally during execution at plan checkpoints and after each logical phase.
- Use `wip(scope): description` format (e.g., `wip(store): add new query functions`).
- Push after each commit to avoid local-only risk.
- See `commit-cadence` in `.claude/rules/worksite-worker.md` for full guidance.
- Do not worry about the commit log — `/worker-commit` at wrap-up will rewrite into clean atomic commits.

### 2. MANDATORY — Self-review quality gate

**DO NOT SKIP THIS STEP.** The stop hook will reject your PR and restart you if you skip it.

Run `/review` (no arguments — it reviews your diff).

a. Read the grade table output. If overall grade is A: proceed to step 2b.
b. If grade is B or below: fix each finding, re-run typecheck and tests, then run `/review` again.
c. Repeat until you get an A. If stuck after 3 `/review` cycles without reaching A, note the remaining issues and proceed.
d. Verify acceptance criteria: for each criterion in the plan, run its proof command fresh and confirm output.

**After completing self-review**, signal the grade so the system knows you ran it:

```
worksite call send_progress --json '{"task_id":"87207bbb","content":"Self-review complete: Grade [X]"}'
```

Replace `[X]` with the overall grade from the review (A, B, C, etc.). This signal is **required** — the stop hook checks for it before allowing PR submission to the reviewer.

### 3. Commit task work

Run `/worker-commit` — it analyzes and groups your changes into atomic commits without interactive approval.

Do NOT use `/commit` — that is the interactive version and will deadlock your session.

### 4. Push

```
git push -u origin refactor/adopt-pg-boss-in-apps-tasks-retire-settimeout-loop
```

### 5. Create the label and PR

First, generate the PR description:

```bash
PR_BODY=$(worksite call generate_pr_description --json '{"task_id":"87207bbb"}' | jq -r .body)
```

Then create the PR using the returned body:

```bash
gh label create "Working" --description "Task in progress" --color "1d76db" --force 2>/dev/null || true
gh pr create --title "Adopt PG-Boss in apps/tasks; retire setTimeout loop" --label "Working" --body "$PR_BODY"
```

You may lightly edit the generated summary bullets for accuracy, but preserve the structure and all sections.

### 6. Self-Reflection

(2-3 minutes max — this is reflection, not a second implementation phase):

**What to capture:**

- Skill gap: things that took multiple attempts or where your initial approach was wrong
- Friction: manual steps that could be automated (hooks, rules, scripts)
- Knowledge: project facts not previously documented
- Automation: patterns that could become `.claude/rules/` entries

**How to capture:**

- Debugging insights, patterns, project quirks → `worksite call update_task --json '{"id":"87207bbb","learning":"..."}'` (max 3-4)
- Permanent project conventions discovered → `worksite call create_idea --json '{"prompt":"[task:87207bbb] Add rule: ..."}'` (max 2)
- If a `.claude/rules/` change is small and clearly in scope: apply it directly, commit, push
  **Exception**: NEVER modify `worksite-worker.md`, `worksite-reviewer.md`, or `worksite-planner.md` — these are agent direction files. Log an idea instead.
  **Exception**: NEVER modify rules files to resolve reviewer findings. If the reviewer flags your code for violating a rule, fix the code — do not weaken or change the rule. Log an idea if you believe the rule itself is wrong.
- Session-specific context (one-off details) → skip, don't persist

### 7. Submit for review

Run `worksite call submit_for_review --json '{"task_id":"87207bbb","pr_url":"https://github.com/jgretz/schwankie/pull/80"}'` — this transitions the task and signals the system. Your job is done after this call.

**Scope drift gate**: If the call rejects with "Scope drift", the PR modifies files outside the planned `fileIntents`. For each listed file, either:
1. **(Default)** Revert: `git checkout origin/main -- <file-path>`, then re-submit
2. **(Exception)** Justify: re-run the call with a `scopeJustifications` field, e.g. `worksite call submit_for_review --stdin <<'JSON' … JSON` with `{"task_id":"87207bbb","pr_url":"https://github.com/jgretz/schwankie/pull/80","scopeJustifications":{"<file>":"<reason>"}}`. The reason must explain why this change is required by THIS task's acceptance criteria, not why it's convenient. The reviewer evaluates justifications and can still flag them as T3 scope findings.

## Reflection Re-engagement

If the task notes include "re-engaged worker for reflection phase", you were re-engaged after the reviewer approved your PR. Your sole job is to capture learnings and transition to `user_review`. Do not implement new features or reopen the task.

Steps (15 minutes max):

1. Scan your task notes and PR diff for insights worth preserving
2. Run `worksite call update_task --json '{"id":"87207bbb","learning":"..."}'` for each meaningful learning (max 3-4)
   - Capture: initial wrong approaches, non-obvious patterns, project-specific gotchas
   - Skip: things that went smoothly, obvious language features
3. Run `worksite call create_idea --json '{"prompt":"[task:87207bbb] ..."}'` for out-of-scope improvements (max 2)
4. Run `worksite call update_task --json '{"id":"87207bbb","note":"Retrospective: <2-3 sentences on what went well and what to improve>"}'`
5. Run `worksite call update_task --json '{"id":"87207bbb","status":"user_review","note":"Reflection complete — ready for user review"}'`
6. Your job is done after the `update_task` call above.

## Re-engagement After User Feedback

If the task notes include "User left PR feedback — re-engaged worker to address comments", you were restarted by the system to address user feedback on the PR. Skip steps 1–8 and go directly to the User Feedback section below.

## Merge Conflict Re-engagement

If the task notes include "PR has merge conflicts — re-engaged worker to rebase onto main", you were restarted to rebase your PR branch onto main. Skip the Execution Workflow section and do the following:

1. `git fetch origin main && git rebase origin/main`
2. Resolve any conflicts, run typecheck and tests to verify
3. `git push --force-with-lease`
   3b. **Verify clean state**: run `git status` (must show "nothing to commit, working tree clean") and `git log origin/refactor/adopt-pg-boss-in-apps-tasks-retire-settimeout-loop..HEAD` (must show 0 commits). If not clean or unpushed commits remain, push again.
4. If rebase fails after 2 attempts, run `worksite call update_task --json '{"id":"87207bbb","attentionMessage":"Merge conflicts I cannot resolve: <summary>"}'`
5. Run `worksite call update_task --json '{"id":"87207bbb","status":"user_review","note":"Resolved merge conflicts — returning to user review"}'` — do NOT call `submit_for_review`; the reviewer already approved the core implementation

## ROLE: You are a WORKER, not a reviewer

You write and fix code. Running `/review` on your own diff as a self-review quality gate is expected and encouraged. You do NOT review other PRs. The following are strictly prohibited:

- Posting PR review comments (`gh pr review`, `gh api .../reviews`)
- Grading other people's code (A/B/C/D/F scores, tiered findings on PRs you didn't author)
- Writing review summaries or assessments of others' PRs
- Calling `worksite call update_task` with `reviewSummary` or `reviewScore` fields

If you see a file named `.worksite-review.md` in the worktree, **ignore it** — it is for the automated reviewer, not you.

## Self-Review Gate Re-engagement

If the task notes include "Self-review gate:" or your inbox contains a directive about skipping self-review, the stop hook rejected your PR because you didn't run `/review`. Do the following:

1. Check your inbox: `worksite call check_inbox --json '{"task_id":"87207bbb"}'`
2. Run `/review` (no arguments — reviews your diff against main)
3. Fix any findings below grade A, re-run typecheck and tests
4. Run `worksite call send_progress --json '{"task_id":"87207bbb","content":"Self-review complete: Grade [X]"}'`
5. If you made fixes, commit and push them
6. Your job is done — exit cleanly. The stop hook will now promote your PR to review.

Do NOT create a new PR. Do NOT skip to step 7 (submit for review). The stop hook handles promotion.

## Reviewer Feedback Re-engagement

If the task notes include "re-engaged worker to address reviewer feedback", you were restarted by the system because the automated reviewer requested changes on your PR. Skip the Execution Workflow section and do the following:

1. Check your inbox: `worksite call check_inbox --json '{"task_id":"87207bbb"}'` — the directive contains the reviewer's specific findings
   1.5. Capture what the reviewer caught: `worksite call update_task --json '{"id":"87207bbb","learning":"Reviewer flagged [what] because [why] — [takeaway for future tasks]"}'`.
   This happens before fixing so you capture the insight while context is fresh.
2. Read the Restart Context above — it contains the PR diff showing your current code vs main. Use this to locate the exact code that needs fixing.
3. For EACH finding (T4/T3 first, then T2):

   **Fix the code, not the rules.** Do NOT modify `.claude/rules/`, `docs/`, or `CLAUDE.md` files to make your code "compliant." The reviewer flagged your implementation — fix the implementation. If you believe a rule is wrong, log an idea; do not change it to pass review.

   **If the finding is `[SCOPE DRIFT]` (out-of-scope file modification):**
   - Revert the file to main's version: `git checkout origin/main -- <file-path>`
   - Do NOT add more edits to justify the change. Revert completely.
   - Confirm revert: `git diff origin/main -- <file-path>` should show no diff.

   **For all other findings:**
   a. `grep` the file for the problematic pattern to confirm it exists
   b. Read the relevant lines — **if the Read tool is blocked** (see Read-Once & Diff Mode section above): use `cat -n <file> | sed -n '<start>,<end>p'` via Bash instead
   c. Edit the file using the EXACT `old_string` from what you just read (not from memory)
   d. After editing, `grep` again to confirm the pattern is GONE. If it persists, your edit failed — re-read and retry.

4. Run typecheck and tests AFTER all findings are addressed
5. Commit and push the fixes
6. **Verify clean state** before considering your work done:
   - `git status` — must show "nothing to commit, working tree clean"
   - `git log origin/refactor/adopt-pg-boss-in-apps-tasks-retire-settimeout-loop..HEAD` — must show 0 commits (all pushed)
     If either check fails, stage/commit/push the remaining changes before proceeding.
7. When all fixes are pushed, run `worksite call submit_for_review --json '{"task_id":"87207bbb","pr_url":"https://github.com/jgretz/schwankie/pull/80"}'` — this re-triggers the reviewer immediately.
8. If you disagree with a finding after one attempt: `worksite call update_task --json '{"id":"87207bbb","attentionMessage":"Reviewer disagreement: <summary>"}'` — do NOT keep trying
9. Your job is done after the `submit_for_review` call.

## User Feedback Re-engagement

If the task notes include "User left PR feedback — re-engaged worker to address comments", skip the Execution Workflow section and do the following:

1. Read the PR comments: `gh pr view https://github.com/jgretz/schwankie/pull/80 --json comments,reviews`
2. Fix the code for each piece of feedback, commit, and push
   2b. **Verify clean state**: run `git status` (must show "nothing to commit, working tree clean") and `git log origin/refactor/adopt-pg-boss-in-apps-tasks-retire-settimeout-loop..HEAD` (must show 0 commits). If not, stage/commit/push remaining changes.
3. When all feedback is addressed, run `worksite call submit_for_review --json '{"task_id":"87207bbb","pr_url":"https://github.com/jgretz/schwankie/pull/80"}'` — this sends your fixes through automated review before returning to the user.
4. Your job is done after the `submit_for_review` call above.



## Repo Patterns

Accumulated knowledge from previous tasks in this repository:

### Environment Quirks
- Singleton patterns are common in JavaScript/TypeScript module initialization (databases, config clients, service clients). Key failure modes: (1) test pollution — module-level singletons without reset() contaminate test suites since modules load once per process; (2) silent overwrites — init() with no guards silently replaces previous config, causing hard-to-debug state bugs; (3) SSR timing — module-level init() calls execute during import (SSR context), not during request handling — async config loading must be lazy, not top-level. Documentation effectiveness: concrete codebase examples (db.ts, client/config.ts) make rules actionable. Code patterns showing CORRECT vs AVOID are more effective than abstract guidance."
- Reviewer feedback was specific and actionable. Finding T4 (unused import) was caught by strict typecheck rules; finding T1 (consolidated imports) improved code organization. Both were trivial fixes requiring careful line-level edits to avoid syntax errors.
- Scope drift: Reviewer approved the core implementation (score 9) but flagged 13 unplanned file modifications in the commit. The core validation logic was correct; the issue was inadvertent changes to .claude/commands, CLAUDE-TASK.md, app routes, and task jobs. Fix: reverted out-of-scope files to main via `git checkout origin/main -- <file>` and re-pushed. Takeaway: commit only the specific files declared in fileIntents, use `git diff --name-only` to verify before push."

### Testing Patterns
- Reviewer flagged mock.module registry contamination because bun's mock.module registry is global across test files in a single run. When multiple files mock the same module (@domain), the alphabetically last file's mock overwrites earlier mocks, contaminating those tests. Fix: ensure the last-registered mock includes ALL symbols that any test file imports from that module — this requires auditing all test files to collect their imports before finalizing the mock in the alphabetically-last file."
- Zod schema validation: when all fields are optional in an update schema (PATCH), an empty body {} is valid. Tests must use genuinely invalid data (e.g., malformed URLs) to test validation rules. The distinction between "semantically valid" (no changes requested) and "schema valid" (passes Zod parsing) matters for test design.
- Zod schema validation gotcha: when all fields in an update schema are optional, an empty body {} is valid per Zod. Tests must use genuinely invalid data (e.g., malformed URLs) to properly test validation rules.

### Architecture Conventions
- Tag count floor feature: Settings table uses key-value pattern with upsert (insert ... onConflictDoUpdate). Drizzle's .$dynamic() is needed for conditional HAVING clauses. Default value handling in API: read setting, fallback to default, handle NaN parsing — three layers of safety. React Query invalidation on mutation success updates dependent queries automatically (tags list). Admin UI input validation before mutation (Number.isInteger check). Sidebar filtering only applies to default tag list (not needs_normalization/canonical queries).
- The pattern of wrapping independent async operations in isolated try/catch blocks (via a helper like runJob) is a clean way to prevent cascade failures in polling loops. This could be extracted into a reusable utility for other polling tasks.
- Auth pattern unification: The initial approach was to add per-route auth to metadata, which meant importing and instantiating authMiddleware in that file. The key insight was recognizing that this is the SAME pattern already used in three other routers—the global middleware was the outlier. This reinforces: establish a single pattern first, then audit for exceptions. The global middleware was misleading because it applied only to routes mounted after it (Hono middleware ordering), creating a false sense of uniform protection.