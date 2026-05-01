# Mac Mini — Tasks Runner

Single Bun TypeScript process that manages the Schwankie tasks worker with
automatic updates from the `main` branch.

## Files

| File | Purpose |
|------|---------|
| `src/runner.ts` | Entry point: main loop, signal handling, orchestration |
| `src/child.ts` | Spawn/stop/restart the tasks worker child process |
| `src/updater.ts` | Git fetch, pull, install, type-check, rollback |
| `src/health.ts` | Poll the API runners list and verify the current child's heartbeat |
| `src/log.ts` | Timestamped structured logging |
| `config.json` | Runner configuration (intervals, branch, health params) |

## Prerequisites

1. **Bun** installed at `~/.bun/bin/bun`
2. **Git** configured with read access to the repo
3. A `.env` file at the repo root with all required environment variables
4. The `main` branch exists on `origin`

## Running

```bash
# From the repo root
bun run deploy/mac-mini/src/runner.ts
```

Bun auto-loads `.env` from cwd. The runner sets `NODE_ENV=production`.

For boot persistence, add as a macOS Login Item or use `nohup`/`tmux`:

```bash
nohup bun run deploy/mac-mini/src/runner.ts > /var/log/schwankie/runner.log 2>&1 &
```

Note: Create `/var/log/schwankie/` directory first (may require sudo):

```bash
sudo mkdir -p /var/log/schwankie && sudo chown $(whoami) /var/log/schwankie
```

## Configuration

Edit `config.json` to change behavior:

```json
{
  "remote": "origin",
  "branch": "main",
  "updateIntervalMs": 120000,
  "drainTimeoutMs": 30000,
  "health": {
    "initialDelayMs": 5000,
    "retries": 6,
    "retryIntervalMs": 5000,
    "staleThresholdMs": 120000
  }
}
```

The runner reads `API_URL` and `API_KEY` from `.env` at the repo root. They
must point at the schwankie API so the orchestrator can poll
`/api/runners` to verify its child's heartbeat.

## How It Works

1. **Spawns** the tasks worker (`bun run --cwd apps/tasks start`) as a child process
2. **Polls** `origin/main` every 2 minutes for new commits
3. **On update**: pulls, installs deps, type-checks, restarts child, then waits for the new child's heartbeat row to appear in the API
4. **On failed update**: rolls back to previous SHA, restarts child on old code
5. **On child crash**: re-spawns with exponential backoff (5s → 10s → ... → 5min cap)
6. **On SIGTERM/SIGINT**: forwards signal to child for graceful pg-boss drain (30s timeout)

The child generates its own UUIDv7 worker id on boot and registers itself
with the API. The orchestrator finds its specific child by `(hostname, pid)`,
so multiple orchestrators on the same host coexist without coordination.

## Checking Status

```bash
# All runners visible to the API
curl "$API_URL/api/runners" | jq

# Runner logs (if using nohup)
tail -f /var/log/schwankie/runner.log
```

## Stopping

Send SIGTERM to the runner process. It will:
1. Cancel the update timer
2. Send SIGTERM to the tasks worker
3. Wait up to 30s for graceful pg-boss drain
4. Exit cleanly

## Multi-Instance

Multiple runners coexist on the same machine. Just start more orchestrator
processes — there is no port to collide on, no env var to set, and no shared
state to manage.

```bash
# Runner A
bun run deploy/mac-mini/src/runner.ts

# Runner B (different shell)
bun run deploy/mac-mini/src/runner.ts
```

Each spawned tasks worker generates a fresh UUIDv7 worker id on boot and
registers itself in the `runner` table via the API. Both show up
independently at `/admin/status`. pg-boss distributes work across all
registered workers automatically.

To stop a specific runner, send SIGTERM to that orchestrator process. The
runner row ages out and can be removed from the admin UI; a daily cron also
sweeps rows older than 30 days.

## Boot Persistence

### Option 1: macOS Login Item

1. Open **System Settings → General → Login Items**
2. Add a new "Allow in the Login Items" entry
3. Create a shell script that runs the runner, or use Automator to launch `bun run deploy/mac-mini/src/runner.ts` with cwd set to the repo root

### Option 2: `nohup` + Cron

Add to your crontab (`crontab -e`):

```cron
@reboot cd /path/to/schwankie && nohup bun run deploy/mac-mini/src/runner.ts > /var/log/schwankie/runner.log 2>&1 &
```

### Option 3: `tmux` Session

Create a persistent tmux session:

```bash
tmux new-session -d -s schwankie-runner -c /path/to/schwankie 'bun run deploy/mac-mini/src/runner.ts'
```

Reattach with: `tmux attach -t schwankie-runner`
