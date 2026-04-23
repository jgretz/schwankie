import {Link} from '@tanstack/react-router';
import {cn} from '@www/lib/utils';
import type {CurrentSection, Tag} from './types';
import {TagList} from './tag-list';
import {sections} from './sections';

type SidebarProps = {
  currentSection: CurrentSection;
  tags: Tag[];
  selectedTags: string[];
  onTagToggle: (tagText: string) => void;
};

function SectionNav({currentSection}: {currentSection: string}) {
  return (
    <nav className="flex flex-col gap-1 border-b border-border pb-4 mb-4">
      {sections.map(({id, label, to}) => (
        <Link
          key={id}
          to={to}
          className={cn(
            'rounded-[5px] px-2 py-[7px] text-sm font-medium text-text-muted transition-colors hover:bg-bg-subtle hover:text-text',
            currentSection === id && 'border-l-2 border-accent bg-bg-subtle text-accent',
          )}
          activeProps={{
            className: 'border-l-2 border-accent bg-bg-subtle text-accent',
          }}
          activeOptions={{exact: false}}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function Sidebar({currentSection, tags, selectedTags, onTagToggle}: SidebarProps) {
  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-[220px] shrink-0 overflow-y-auto border-r border-border p-[1.5rem_1rem_2rem] [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] md:block">
      <SectionNav currentSection={currentSection} />
      {currentSection === 'queue' && (
        <TagList tags={tags} selectedTags={selectedTags} onTagToggle={onTagToggle} />
      )}
    </aside>
  );
}
