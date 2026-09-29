# Neon Idle Cadence

<!-- Adding an incidental implementation note (dependency override, workaround, gotcha)? It goes in the top-level "## Implementation Notes" section — never nested under a tier/layer/phase heading. See .claude/rules/doc-structure.md. -->

## Problem

The production database is a Neon project billed per compute-hour. Neon suspends a
compute only after **5 minutes with zero queries**, and the plan cannot shorten that
window. Any traffic that arrives more often than every ~5 minutes pins the compute
awake at its 0.25 CU floor around the clock, and that idle baseline is most of the bill.

The runner used to defeat suspension in two ways: a heartbeat every 60 s and a
work-request poll every 5 min, each of which reached Neon through the API.

## The Burst Rule

While idle, runner-originated Neon traffic happens only on the burst minutes in
`BURST_MINUTES` (`apps/tasks/src/lib/burst-schedule.ts`): `:00` and `:45` UTC.
`BURST_CRON` is built from that constant, and every scheduler cron in
`apps/tasks/src/job-definitions.ts` uses it. The daily cleanups (04:00 and 05:00 UTC)
also land on `:00`. pg-boss evaluates crons in UTC and keeps its own state on local
Postgres, so scheduling itself costs Neon nothing.

Neon then suspends in the gaps: about 10 min of the 15-min `:45 → :00` gap and about
40 min of the 45-min `:00 → :45` gap.

## Heartbeat

`startHeartbeatLoop` (`apps/tasks/src/lib/heartbeat.ts`) fires at each burst minute
via a recursive `setTimeout`, not a fixed interval, so a runner started at `:20` does
not beat at `:20`, `:05`, `:50`. The runner still beats once at boot: the mac-mini
supervisor's post-update health check needs a fresh heartbeat from the new child.

A healthy heartbeat can now be up to 45 min old, so `apps/api/src/lib/runner-status.ts`
classifies a runner as healthy up to 50 min, stale up to 2 h, and dead after that.

## Work Requests: Hinted Poll + Burst Sweep

The refresh buttons (`POST /api/feeds/refresh`, `/api/emails/refresh`) create a work
request and set an in-memory flag in the API (`apps/api/src/lib/work-request-signal.ts`).

- `process-work-requests` runs every 5 min and calls `GET /api/work/pending?mode=hinted`.
  The API takes and clears the flag; if it was clear, it returns `[]` without touching
  Neon. If the query fails, the flag is set again.
- `sweep-work-requests` runs on `BURST_CRON` (and at boot) with `?mode=full`, which
  always queries. It catches any request whose hint was lost.

A `GET /api/work/pending` with no mode behaves as `full`, so the API and runner can
deploy in either order.

Refresh latency is ≤5 min typically and ≤45 min worst case.

The flag assumes a single API instance, the same assumption `links-version.ts` makes.
A second Fly machine or an API restart loses hints, and the burst sweep bounds that
loss to one burst gap. Move the flag to a shared store if the API scales out.

## Enforcement

`apps/tasks/tests/job-definitions.test.ts` asserts that every non-empty cron's minute
field lists only `BURST_MINUTES`. The one exemption is the `NEON_FREE_WHEN_IDLE`
allowlist (`process-work-requests`), and a second test fails if an allowlisted queue
no longer needs its exemption. Adding an off-burst cron means either putting it on
`BURST_CRON` or proving it stays off Neon while idle.

## Verifying in Production

Neon's hourly `compute_unit_seconds` for the project should fall well below 900 (a
compute awake all hour at 0.25 CU) in idle hours.
