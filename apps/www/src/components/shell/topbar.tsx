import {Link} from '@tanstack/react-router';
import {cn} from '@www/lib/utils';

type TopbarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  showAddButton: boolean;
  onAddClick: () => void;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
};

// Routes that don't exist yet use string cast — will resolve when route files are added
const navLinks: {to: string; label: string; exact: boolean}[] = [
  {to: '/', label: 'Feed', exact: true},
  {to: '/queue', label: 'Queue', exact: false},
  {to: '/about', label: 'About', exact: false},
];

export function Topbar({
  searchValue,
  onSearchChange,
  showAddButton,
  onAddClick,
  onMenuClick,
  showMenuButton,
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-[100] flex h-14 items-center gap-8 border-b border-border bg-bg px-8">
      {showMenuButton && (
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-subtle hover:text-text md:hidden"
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

      <div className="relative max-w-[480px] flex-1">
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

      <nav className="ml-auto flex">
        {navLinks.map(({to, label, exact}) => (
          <Link
            key={to}
            to={to as '/'}
            className="rounded-[5px] px-3 py-1.5 text-[0.8rem] font-medium text-text-muted transition-colors hover:bg-bg-subtle hover:text-text"
            activeProps={{className: '!text-accent'}}
            activeOptions={{exact}}
          >
            {label}
          </Link>
        ))}
      </nav>

      {showAddButton && (
        <button
          type="button"
          onClick={onAddClick}
          className={cn(
            'ml-2 flex h-[30px] w-[30px] items-center justify-center rounded-md border-[1.5px] border-border text-text-muted transition-colors',
            'hover:border-accent hover:bg-bg-subtle hover:text-accent',
          )}
          aria-label="Add link"
        >
          +
        </button>
      )}
    </header>
  );
}
