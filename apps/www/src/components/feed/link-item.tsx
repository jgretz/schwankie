import {cn} from '@www/lib/utils';
import {selectionBg} from '@www/lib/selection-styles';
import {HighlightText} from './highlight-text';

type LinkItemProps = {
  id: number;
  url: string;
  title: string;
  description: string | null;
  date: string;
  tags: Array<{id: number; text: string}>;
  activeTags: string[];
  onTagClick: (tagText: string) => void;
  showEditButton: boolean;
  onEditClick: (linkId: number) => void;
  showRefetchButton?: boolean;
  onRefetchClick?: (linkId: number) => void;
  isRefetching?: boolean;
  searchQuery?: string;
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {month: 'short', day: 'numeric', year: 'numeric'}).format(
    new Date(iso),
  );
}

export function LinkItem({
  id,
  url,
  title,
  description,
  date,
  tags,
  activeTags,
  onTagClick,
  showEditButton,
  onEditClick,
  showRefetchButton,
  onRefetchClick,
  isRefetching,
  searchQuery,
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

        {(showRefetchButton || showEditButton) && (
          <span className="ml-auto flex items-center gap-2 opacity-0 transition-opacity duration-100 group-hover:opacity-100">
            {showRefetchButton && (
              <button
                type="button"
                onClick={() => onRefetchClick?.(id)}
                disabled={isRefetching}
                aria-label="Re-fetch link"
                className="text-text-faint transition-colors hover:text-text-muted disabled:opacity-50"
              >
                {isRefetching ? (
                  <span className="block h-[13px] w-[13px] animate-spin rounded-full border-[1.5px] border-text-faint border-t-accent" />
                ) : (
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21.5 2v6h-6" />
                    <path d="M2.5 22v-6h6" />
                    <path d="M2.5 11.5a10 10 0 0 1 18.8-4.3" />
                    <path d="M21.5 12.5a10 10 0 0 1-18.8 4.2" />
                  </svg>
                )}
              </button>
            )}
            {showEditButton && (
              <button
                type="button"
                onClick={() => onEditClick(id)}
                aria-label="Edit link"
                className="text-text-faint transition-colors hover:text-text-muted"
              >
                <svg
                  width="13"
                  height="13"
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
            )}
          </span>
        )}
      </div>
    </div>
  );
}
