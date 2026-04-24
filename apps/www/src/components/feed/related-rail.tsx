import type {RelatedLinkData} from 'client';
import {useRelatedLinks} from '@www/hooks/use-related-links';

type RelatedRailProps = {
  linkId: number | null;
};

function formatBadge(item: RelatedLinkData): string {
  if (item.similarity != null) return `~${Math.round(item.similarity * 100)}%`;
  if (item.overlap != null) return `${item.overlap} tag${item.overlap === 1 ? '' : 's'}`;
  return '';
}

export function RelatedRail({linkId}: RelatedRailProps) {
  const {data, isLoading, isError} = useRelatedLinks(linkId, 8);

  if (linkId == null) return null;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({length: 3}, (_, i) => (
          <div key={i} className="h-4 w-2/3 animate-pulse rounded bg-border" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="font-sans text-[0.75rem] text-text-faint">
        Couldn&apos;t load related links.
      </p>
    );
  }

  const items = data?.items ?? [];
  if (items.length === 0) {
    return (
      <p className="font-sans text-[0.75rem] text-text-faint">
        No related links yet — come back after the library embeds more content.
      </p>
    );
  }

  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item.id} className="flex items-baseline gap-2">
          <span className="shrink-0 font-sans text-[0.7rem] tabular-nums text-text-faint">
            {formatBadge(item)}
          </span>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate font-serif text-[0.85rem] text-text transition-colors hover:text-accent"
            title={item.title}
          >
            {item.title}
          </a>
        </li>
      ))}
    </ul>
  );
}
