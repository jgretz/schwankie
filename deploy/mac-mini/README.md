# Mac Mini — Tasks Runner

Single Bun TypeScript process that manages the Schwankie tasks worker with
automatic updates from the `main` branch.

## Files

| File | Purpose |
|------|---------|
| `src/runner.ts` | Entry point: main loop, signal handling, orchestration |
| `src/child.ts` | Spawn/stop/restart the tasks worker child process |
| `src/updater.ts` | Git fetch, pull, install, type-check, rollback |
| `src/health.ts` | Poll health endpoint with retries |
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
    "url": "http://localhost:3002/health",
    "initialDelayMs": 5000,
    "retries": 6,
    "retryIntervalMs": 5000
  }
}
```

## How It Works

1. **Spawns** the tasks worker (`bun run --cwd apps/tasks start`) as a child process
2. **Polls** `origin/main` every 2 minutes for new commits
3. **On update**: pulls, installs deps, type-checks, restarts child, health-checks
4. **On failed update**: rolls back to previous SHA, restarts child on old code
5. **On child crash**: re-spawns with exponential backoff (5s → 10s → ... → 5min cap)
6. **On SIGTERM/SIGINT**: forwards signal to child for graceful pg-boss drain (30s timeout)

## Checking Status

```bash
# Health endpoint (once the worker is up)
curl http://localhost:3002/health

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

Multiple runners can coexist on the same machine. Each runner must have a unique
`WORKER_ID` so PG-Boss correctly distributes work among job processors.

```bash
# Runner A (binds to health port 3002)
bun run deploy/mac-mini/src/runner.ts

# Runner B (same health port — one runner per port)
# (Configure different health port in separate config.json or env var if needed)
WORKER_ID=worker-b bun run deploy/mac-mini/src/runner.ts
```

**Note**: Each runner polls the same health endpoint (`localhost:3002/health`).
Only one runner can bind to port 3002 for health checks. To run multiple runners
on the same machine:

1. Run the first runner normally — it claims port 3002
2. For additional runners, either:
   - Skip the health check (edit config.json to not monitor health)
   - Or run them on different machines
3. All runners share the same `main` branch and pg-boss database — work distributes automatically

PG-Boss will assign jobs to any available worker (identified by unique `WORKER_ID`).

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
