import {useRef, useState} from 'react';
import {cn} from '@www/lib/utils';
import {selectionBg} from '@www/lib/selection-styles';
import type {Tag} from './types';

type TagListProps = {
  tags: Tag[];
  selectedTags: string[];
  onTagToggle: (tagText: string) => void;
};

export function TagList({tags, selectedTags, onTagToggle}: TagListProps) {
  const firstSelectedText = selectedTags[0];
  const [filter, setFilter] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredTags = filter
    ? tags.filter((t) => t.text.toLowerCase().includes(filter.toLowerCase()))
    : tags;

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between px-1.5 text-[0.68rem] font-medium uppercase tracking-[0.1em] text-text-faint">
        {isSearching ? (
          <>
            <input
              ref={inputRef}
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              autoFocus
              placeholder="Search tags…"
              className="w-full bg-transparent text-[0.68rem] text-text-faint placeholder:text-text-faint/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                setFilter('');
                setIsSearching(false);
              }}
              className="ml-1 shrink-0 cursor-pointer text-text-faint hover:text-text-muted"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M2 2l8 8M10 2l-8 8" />
              </svg>
            </button>
          </>
        ) : (
          <>
            <span>Tags — click to filter</span>
            <button
              type="button"
              onClick={() => setIsSearching(true)}
              className="shrink-0 cursor-pointer text-text-faint hover:text-text-muted"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="5" cy="5" r="3.5" />
                <path d="M7.5 7.5L10.5 10.5" />
              </svg>
            </button>
          </>
        )}
      </div>
      <div className="flex flex-col gap-px">
        {filteredTags.length === 0 && (
          <span className="px-2 py-2 text-[0.78rem] text-text-faint">No tags yet</span>
        )}
        {filteredTags.map((tag) => {
          const isSelected = selectedTags.includes(tag.text);
          const isFirst = tag.text === firstSelectedText;

          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => onTagToggle(tag.text)}
              className={cn(
                'flex cursor-pointer select-none items-start justify-between rounded-[5px] px-2 py-[5px] transition-[background] duration-100',
                !isSelected && 'hover:bg-bg-subtle',
                isSelected && selectionBg(isFirst),
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
