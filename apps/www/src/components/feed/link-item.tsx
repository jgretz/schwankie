import {memo} from 'react';
import type {LinkData} from 'client';
import {cn} from '@www/lib/utils';
import {selectionBg} from '@www/lib/selection-styles';
import {HighlightText} from './highlight-text';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

type LinkItemProps = {
  url: string;
  title: string;
  description: string | null;
  date: string;
  tags: Array<{id: number; text: string}>;
  activeTags: string[];
  onTagClick: (tagText: string) => void;
  showEditButton: boolean;
  onEditClick: (link: LinkData) => void;
  linkData: LinkData;
  searchQuery?: string;
  score?: number | null;
  showScore?: boolean;
};

function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

function scoreStyle(score: number): React.CSSProperties {
  if (score >= 70)
    return {backgroundColor: 'var(--score-high-bg)', color: 'var(--score-high-text)'};
  if (score >= 40) return {backgroundColor: 'var(--score-mid-bg)', color: 'var(--score-mid-text)'};
  return {backgroundColor: 'var(--score-low-bg)', color: 'var(--score-low-text)'};
}

function LinkItemComponent({
  url,
  title,
  description,
  date,
  tags,
  activeTags,
  onTagClick,
  showEditButton,
  onEditClick,
  linkData,
  searchQuery,
  score,
  showScore,
}: LinkItemProps) {
  return (
    <div className="group border-b border-border py-[0.9rem] last:border-b-0">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-[0.3rem] block font-serif text-[0.975rem] font-medium leading-[1.35] text-text transition-colors duration-100 hover:text-accent"
      >
        <HighlightText text={title} query={searchQuery} />
      </a>

      {description && (
        <p className="mb-[0.5rem] line-clamp-2 font-sans text-[0.82rem] leading-[1.5] text-text-muted">
          <HighlightText text={description} query={searchQuery} />
        </p>
      )}

      <div className="flex flex-wrap items-center gap-[0.35rem]">
        <span className="mr-[0.25rem] font-sans text-[0.72rem] font-medium tabular-nums text-text-faint">
          {formatDate(date)}
        </span>

        {showScore && score != null && (
          <span
            className="inline-flex h-[40px] w-[40px] items-center justify-center rounded-full font-sans text-[0.75rem] font-semibold tabular-nums leading-none"
            style={scoreStyle(score)}
            title={`Score: ${score}/100`}
          >
            {score}
          </span>
        )}

        {tags.map((tag) => {
          const activeIndex = activeTags.indexOf(tag.text);
          const isActive = activeIndex !== -1;
          const isPrimary = activeIndex === 0;
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => onTagClick(tag.text)}
              className={cn(
                'inline-flex cursor-pointer items-center rounded-[3px] px-2 py-[2px] font-sans text-[0.72rem] leading-[1.6] transition-colors duration-100',
                !isActive && 'bg-tag-bg text-tag-text hover:bg-accent hover:text-white',
                isActive && cn(selectionBg(isPrimary), 'text-white'),
              )}
            >
              {tag.text}
            </button>
          );
        })}

        {showEditButton && (
          <span className="ml-auto flex items-center gap-2 opacity-0 transition-opacity duration-100 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => onEditClick(linkData)}
              aria-label="Edit link"
              className="p-1 text-text-faint transition-colors hover:text-text-muted"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </span>
        )}
      </div>
    </div>
  );
}

export const LinkItem = memo(LinkItemComponent);
