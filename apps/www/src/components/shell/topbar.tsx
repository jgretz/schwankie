import {Link} from '@tanstack/react-router';
import {ThemeToggle} from '@www/components/theme-toggle';
import {cn} from '@www/lib/utils';

type TopbarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  showAddButton: boolean;
  onAddClick: () => void;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
  menuButtonMobileOnly?: boolean;
};

export function Topbar({
  searchValue,
  onSearchChange,
  showAddButton,
  onAddClick,
  onMenuClick,
  showMenuButton,
  menuButtonMobileOnly,
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-[100] border-b border-border bg-bg">
      <div className="flex h-14 items-center gap-3 px-4 md:gap-4 md:px-8">
        {showMenuButton && (
          <button
            type="button"
            onClick={onMenuClick}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-subtle hover:text-text',
              menuButtonMobileOnly && 'md:hidden',
            )}
            aria-label="Open menu"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
        )}

        <Link
          to="/"
          className="whitespace-nowrap font-serif text-[1.05rem] font-semibold tracking-tight text-text no-underline"
        >
          schwankie
        </Link>

        <div className="relative min-w-0 flex-1 md:max-w-[480px]">
          <svg
            className="pointer-events-none absolute left-[10px] top-1/2 -translate-y-1/2 text-text-faint"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search links…"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-md border border-border bg-search-bg px-3 py-[7px] pl-[34px] font-sans text-sm text-text outline-none transition-colors placeholder:text-text-faint focus:border-accent"
          />
        </div>

        <div className="ml-auto hidden md:block">
          <ThemeToggle />
        </div>

        {showAddButton && (
          <button
            type="button"
            onClick={onAddClick}
            className={cn(
              'ml-1 hidden h-[30px] w-[30px] items-center justify-center rounded-md border-[1.5px] border-border text-text-muted transition-colors md:flex',
              'hover:border-accent hover:bg-bg-subtle hover:text-accent',
            )}
            aria-label="Add link"
          >
            +
          </button>
        )}

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          {showAddButton && (
            <button
              type="button"
              onClick={onAddClick}
              className={cn(
                'ml-1 flex h-[28px] w-[28px] items-center justify-center rounded-md border-[1.5px] border-border text-text-muted transition-colors',
                'hover:border-accent hover:bg-bg-subtle hover:text-accent',
              )}
              aria-label="Add link"
            >
              +
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
