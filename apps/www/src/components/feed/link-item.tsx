import {cn} from '@www/lib/utils';

type LinkItemProps = {
  id: number;
  url: string;
  title: string;
  description: string | null;
  date: string;
  tags: Array<{id: number; text: string}>;
  activeTagIds: number[];
  onTagClick: (tagId: number) => void;
  showEditButton: boolean;
  onEditClick: (linkId: number) => void;
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {month: 'short', day: 'numeric', year: 'numeric'}).format(new Date(iso));
}

export function LinkItem({
  id,
  url,
  title,
  description,
  date,
  tags,
  activeTagIds,
  onTagClick,
  showEditButton,
  onEditClick,
}: LinkItemProps) {
  return (
    <div className="group border-b border-border py-[0.9rem] last:border-b-0">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-[0.3rem] block font-serif text-[0.975rem] font-medium leading-[1.35] text-text transition-colors duration-100 hover:text-accent"
      >
        {title}
      </a>

      {description && (
        <p className="mb-[0.5rem] line-clamp-2 font-sans text-[0.82rem] leading-[1.5] text-text-muted">
          {description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-[0.35rem]">
        <span className="mr-[0.25rem] font-sans text-[0.72rem] font-medium tabular-nums text-text-faint">
          {formatDate(date)}
        </span>

        {tags.map((tag) => {
          const isActive = activeTagIds.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => onTagClick(tag.id)}
              className={cn(
                'inline-flex cursor-pointer items-center rounded-[3px] px-2 py-[2px] font-sans text-[0.72rem] leading-[1.6] transition-colors duration-100',
                isActive
                  ? 'bg-accent text-white'
                  : 'bg-tag-bg text-tag-text hover:bg-accent hover:text-white',
              )}
            >
              {tag.text}
            </button>
          );
        })}

        {showEditButton && (
          <button
            type="button"
            onClick={() => onEditClick(id)}
            aria-label="Edit link"
            className="ml-auto text-text-faint opacity-0 transition-opacity duration-100 hover:text-text-muted group-hover:opacity-100"
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
      </div>
    </div>
  );
}
