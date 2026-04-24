import {Button} from '@www/components/ui/button';

type SelectionToolbarProps = {
  selectedCount: number;
  visibleCount: number;
  onSelectAll: () => void;
  onOpen: () => void;
  onDelete: () => void;
  onClear: () => void;
};

export function SelectionToolbar({
  selectedCount,
  visibleCount,
  onSelectAll,
  onOpen,
  onDelete,
  onClear,
}: SelectionToolbarProps) {
  const allSelected = visibleCount > 0 && selectedCount === visibleCount;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[5px] border border-border bg-bg-subtle px-3 py-2">
      <span className="font-sans text-[0.82rem] font-medium text-text">
        {selectedCount} selected
      </span>
      <div className="ml-auto flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={onOpen}>
          Open {selectedCount}
        </Button>
        <Button size="sm" variant="destructive" onClick={onDelete}>
          Delete {selectedCount}
        </Button>
        {!allSelected && (
          <Button size="sm" variant="ghost" onClick={onSelectAll}>
            Select all
          </Button>
        )}
        <button
          type="button"
          onClick={onClear}
          className="font-sans text-[0.8rem] text-text-muted transition-colors hover:text-text"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
