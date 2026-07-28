import type {TagItem} from '@www/components/admin/tag-row';

/** Case-insensitive substring match against the tag text. */
export function filterTags(tags: TagItem[], query: string): TagItem[] {
  if (!query) return tags;

  const needle = query.toLowerCase();

  return tags.filter((tag) => tag.text.toLowerCase().includes(needle));
}
