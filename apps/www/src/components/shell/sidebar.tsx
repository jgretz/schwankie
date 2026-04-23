import {TagList} from './tag-list';
import type {CurrentSection, Tag} from './types';

type SidebarProps = {
  currentSection: CurrentSection;
  tags: Tag[];
  selectedTags: string[];
  onTagToggle: (tagText: string) => void;
};

const TAG_SECTIONS: readonly CurrentSection[] = ['queue', 'public'];

export function Sidebar({currentSection, tags, selectedTags, onTagToggle}: SidebarProps) {
  if (!TAG_SECTIONS.includes(currentSection)) return null;

  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-[220px] shrink-0 overflow-y-auto border-r border-border p-[1.5rem_1rem_2rem] [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] md:block">
      <TagList tags={tags} selectedTags={selectedTags} onTagToggle={onTagToggle} />
    </aside>
  );
}
