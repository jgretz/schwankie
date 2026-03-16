import {cn} from '@www/lib/utils';
import type {Tag} from './types';

type SidebarProps = {
  tags: Tag[];
  selectedTagIds: number[];
  onTagToggle: (tagId: number) => void;
};

export function Sidebar({tags, selectedTagIds, onTagToggle}: SidebarProps) {
  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-56px)] w-[220px] shrink-0 overflow-y-auto border-r border-border p-[1.5rem_1rem_2rem] [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] md:block">
      <TagList tags={tags} selectedTagIds={selectedTagIds} onTagToggle={onTagToggle} />
    </aside>
  );
}

export function TagList({tags, selectedTagIds, onTagToggle}: SidebarProps) {
  const firstSelectedId = selectedTagIds[0];

  return (
    <div>
      <div className="mb-2.5 px-1.5 text-[0.68rem] font-medium uppercase tracking-[0.1em] text-text-faint">
        Tags — click to filter
      </div>
      <div className="flex flex-col gap-px">
        {tags.map((tag) => {
          const isSelected = selectedTagIds.includes(tag.id);
          const isFirst = tag.id === firstSelectedId;

          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => onTagToggle(tag.id)}
              className={cn(
                'flex cursor-pointer select-none items-center justify-between rounded-[5px] px-2 py-[5px] transition-[background] duration-[120ms]',
                !isSelected && 'hover:bg-bg-subtle',
                isSelected && isFirst && 'bg-tag-active-bg',
                isSelected &&
                  !isFirst &&
                  'bg-[color-mix(in_srgb,var(--tag-active-bg)_65%,var(--bg-subtle))]',
              )}
            >
              <span
                className={cn(
                  'flex items-center gap-[5px] text-[0.82rem]',
                  isSelected ? 'text-white' : 'text-text-muted',
                )}
              >
                <span
                  className={cn(
                    'relative h-[13px] w-[13px] shrink-0 rounded-sm border-[1.5px] border-current',
                    isSelected ? 'opacity-100' : 'opacity-35',
                  )}
                >
                  {isSelected && (
                    <span className="absolute left-[1.5px] top-[1px] block h-[4.5px] w-[7px] -rotate-45 border-b-[1.5px] border-l-[1.5px] border-tag-active-text" />
                  )}
                </span>
                {tag.text}
              </span>
              <span
                className={cn(
                  'text-[0.72rem] tabular-nums',
                  isSelected ? 'text-white opacity-75' : 'text-text-faint',
                )}
              >
                {tag.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
