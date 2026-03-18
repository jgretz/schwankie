import {createFileRoute} from '@tanstack/react-router';
import {useDeadLinks} from '@www/hooks/use-dead-links';
import {Button} from '@www/components/ui/button';

export const Route = createFileRoute('/admin/dead-links')({
  component: AdminDeadLinksPage,
});

function AdminDeadLinksPage() {
  const {data, isLoading, isError, retryLink, deleteLink} = useDeadLinks();
  const items = data?.items ?? [];

  return (
    <div className="px-6 py-6">
      <div className="mb-5 flex items-baseline gap-3">
        <h2 className="font-serif text-[1.35rem] font-semibold text-text">Dead Links</h2>
        <span className="font-sans text-[0.8rem] text-text-faint">{data?.total ?? 0}</span>
      </div>

      {isLoading && (
        <div className="animate-pulse space-y-4">
          {Array.from({length: 3}, (_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-3/4 rounded bg-border" />
              <div className="h-3 w-1/2 rounded bg-border" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <p className="py-12 text-center font-sans text-[0.9rem] text-red-600">
          Failed to load dead links.
        </p>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <p className="py-12 text-center font-sans text-[0.9rem] text-text-muted">
          No dead links. All clear.
        </p>
      )}

      {items.length > 0 && (
        <div>
          {items.map((item) => (
            <div key={item.id} className="border-b border-border py-[0.9rem] last:border-b-0">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-[0.3rem] block font-serif text-[0.975rem] font-medium leading-[1.35] text-text transition-colors duration-100 hover:text-accent"
              >
                {item.title}
              </a>

              <p className="mb-2 font-sans text-[0.78rem] text-text-faint">{item.url}</p>

              <div className="flex items-center gap-3">
                <span className="rounded bg-red-100 px-2 py-0.5 font-sans text-[0.72rem] text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  {item.enrichmentLastError} ({item.enrichmentFailCount} failures)
                </span>

                <div className="ml-auto flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => retryLink(item.id)}>
                    Retry
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => deleteLink(item.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
