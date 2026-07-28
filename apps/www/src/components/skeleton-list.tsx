type SkeletonListProps = {
  /** Number of placeholder rows to render. */
  rows: number;
};

/**
 * Loading placeholder for the feed and admin list pages.
 *
 * Rows are static and never reorder, so positional identity *is* the correct identity
 * here — the template key states that intent explicitly rather than handing React a
 * bare index (`noArrayIndexKey`).
 */
export function SkeletonList({rows}: SkeletonListProps) {
  const keys = Array.from({length: rows}, (_, i) => `skeleton-row-${i}`);

  return (
    <div className="animate-pulse space-y-4">
      {keys.map((key) => (
        <div key={key} className="space-y-2">
          <div className="h-4 w-3/4 rounded bg-border" />
          <div className="h-3 w-1/2 rounded bg-border" />
        </div>
      ))}
    </div>
  );
}
