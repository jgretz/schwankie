import {cn} from '@www/lib/utils';

type FilterStripProps = {
  activeTags: Array<{text: string}>;
  totalCount: number;
  onRemoveTag: (tagText: string) => void;
  onClearAll: () => void;
};

export function FilterStrip({activeTags, totalCount, onRemoveTag, onClearAll}: FilterStripProps) {
  if (activeTags.length === 0) return null;

  return (
    <div className="mb-[1.1rem] flex flex-wrap items-center gap-[0.4rem] rounded-[6px] border border-border bg-bg-subtle px-3 py-2 font-sans text-[0.8rem] text-text-muted">
      <span className="mr-[0.1rem] text-[0.72rem] uppercase tracking-[0.07em] text-text-faint">
        Filtering by
      </span>

      {activeTags.map((tag, index) => (
        <span key={tag.text} className="inline-flex items-center gap-[0.35rem]">
          {index > 0 && <span className="text-[0.68rem] italic text-text-faint">+</span>}
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-[3px] px-2 py-[2px] text-[0.75rem] font-medium text-pill-text',
              index === 0 ? 'bg-pill-bg' : 'bg-tag-active-bg-secondary',
            )}
          >
            {tag.text}
            <button
              type="button"
              onClick={() => onRemoveTag(tag.text)}
              aria-label={`Remove ${tag.text} filter`}
              className="cursor-pointer text-[0.9rem] opacity-70 transition-opacity hover:opacity-100"
            >
              ×
            </button>
          </span>
        </span>
      ))}

      <span className="ml-auto text-[0.75rem] text-text-faint">{totalCount} links</span>

      <button
        type="button"
        onClick={onClearAll}
        className="cursor-pointer text-[0.72rem] text-text-faint underline transition-colors hover:text-text"
      >
        Clear all
      </button>
    </div>
  );
}
