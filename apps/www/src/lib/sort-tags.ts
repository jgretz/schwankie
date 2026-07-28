import type {TagItem} from '@www/components/admin/tag-row';

/** Returns a new array sorted by link count, descending. Never mutates the input. */
export function sortTagsByCount(tags: TagItem[]): TagItem[] {
  return [...tags].sort((a, b) => b.count - a.count);
}
