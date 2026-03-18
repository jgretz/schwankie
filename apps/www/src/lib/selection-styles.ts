/**
 * Returns Tailwind bg class for primary vs secondary selection state.
 * Primary = first selected item (index 0), secondary = subsequent selections.
 */
export function selectionBg(isPrimary: boolean): string {
  return isPrimary ? 'bg-tag-active-bg' : 'bg-tag-active-bg-secondary';
}
