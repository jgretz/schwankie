/**
 * Stable keys for fixed-length loading skeletons. Skeleton rows are static and never
 * reorder, but keying off the raw array index trips `noArrayIndexKey`; these literal
 * keys make that "this list is static" intent explicit.
 *
 * Slice to the row count you need: `SKELETON_KEYS.slice(0, 3).map((key) => …)`.
 */
export const SKELETON_KEYS = Array.from({length: 5}, (_, i) => `skeleton-${i + 1}`);
