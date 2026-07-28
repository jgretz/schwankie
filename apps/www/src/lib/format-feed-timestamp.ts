const EM_DASH = '—';

let formatter: Intl.DateTimeFormat | null = null;

/**
 * Constructing an `Intl.DateTimeFormat` is the expensive part, so the instance
 * is shared. It is created lazily rather than at module scope to keep the module
 * import side-effect-free (`"sideEffects": false`) and off the SSR import path.
 * The locale stays `undefined` so it resolves the runtime default, exactly as
 * the previous `toLocaleDateString(undefined, …)` call did.
 *
 * Unlike the configured singletons in `db.ts`/`config.ts`, this one takes no
 * injected state — the cached value is a pure function of the module's own
 * constants — so it needs no `reset()` for test isolation.
 */
function getFormatter(): Intl.DateTimeFormat {
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return formatter;
}

/** Renders an ISO timestamp for the feeds table; an em-dash stands in for anything unusable. */
export function formatFeedTimestamp(iso: string | null): string {
  if (!iso) return EM_DASH;

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return EM_DASH;

  return getFormatter().format(date);
}
