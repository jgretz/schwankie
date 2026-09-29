// Set when a refresh work request is created, so the runner's 5-minute hinted
// poll can answer "nothing pending" from memory instead of querying Neon, which
// would keep the compute from ever reaching its 5-minute suspend window.
//
// Single-instance assumption: the api currently runs as one Fly machine
// (min_machines_running: 1), same as links-version.ts. A hint lost to a restart
// or set on another instance is picked up by the runner's full sweep on the
// :00/:45 burst, so a miss delays a refresh by at most 45 min.

let pending = false;

export function markWorkRequestPending(): void {
  pending = true;
}

export function takeWorkRequestPending(): boolean {
  const wasPending = pending;
  pending = false;
  return wasPending;
}

export function resetWorkRequestSignal(): void {
  pending = false;
}
