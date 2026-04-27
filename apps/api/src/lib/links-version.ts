// Tracks the timestamp of the most recent link mutation. Consumed by the www
// app's /rss handler as a cheap cache key — when this value matches what www
// has cached, www serves the cached XML; otherwise it re-renders.
//
// Single-instance assumption: the api currently runs as one Fly machine
// (min_machines_running: 1). If api scales horizontally, this in-memory stamp
// will diverge across instances — promote to a shared store at that point.

let lastModified: string | null = null;

export function bumpLinksVersion(): void {
  lastModified = new Date().toISOString();
}

export function getLinksVersion(): string | null {
  return lastModified;
}

export function resetLinksVersion(): void {
  lastModified = null;
}
