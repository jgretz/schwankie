import type {Tag} from './types';
import {TagList} from './tag-list';

type SidebarProps = {
  tags: Tag[];
  selectedTagIds: number[];
  onTagToggle: (tagId: number) => void;
};

export function Sidebar({tags, selectedTagIds, onTagToggle}: SidebarProps) {
  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-[220px] shrink-0 overflow-y-auto border-r border-border p-[1.5rem_1rem_2rem] [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] md:block">
      <TagList tags={tags} selectedTagIds={selectedTagIds} onTagToggle={onTagToggle} />
    </aside>
  );
}
