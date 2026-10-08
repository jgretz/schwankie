# pg-boss Rules

## Multi-Worker Architecture

pg-boss uses PostgreSQL row-level locking to distribute jobs. Multiple workers
connecting to the same database will each receive different jobs — no
application-level coordination needed.

```ts
// Each worker calls boss.work() independently; pg-boss ensures no job is
// delivered to more than one worker at a time.
await boss.work('import-feed', handler);
```

## Cron Deduplication

`boss.schedule()` registers a cron that fires **once per interval** regardless
of how many workers are connected. Do not add application-level guards against
duplicate cron fires — pg-boss handles this.

## Idempotency is the Only Application Concern

Since cron jobs fire exactly once, the primary concern for horizontal scaling is
handler idempotency:

- Handlers should produce the same result whether run once or twice
- Use unique constraints in the database (not application logic) to prevent
  duplicate records
- Marking an external resource (e.g. Gmail message as read) is inherently
  idempotent

## Connection Pool

Pass `max` to the PgBoss constructor to control the PostgreSQL connection pool
per worker instance. Total DB connections = `max × worker_count`.

```ts
const boss = new PgBoss({
  connectionString,
  max: parseInt(process.env.PG_POOL_SIZE || '10', 10),
});
```

## Production vs. Local Dev

Use `PGBOSS_DATABASE_URL` for production (external Postgres). Without it,
fall back to a local Docker container. Never hardcode the connection string.
