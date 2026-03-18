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
  isAuthenticated?: boolean;
};

type NavLink = {to: '/' | '/queue' | '/admin'; label: string; exact: boolean; icon?: 'settings'};

const publicLinks: NavLink[] = [{to: '/', label: 'Compendium', exact: true}];

const adminLinks: NavLink[] = [
  {to: '/queue', label: 'Queue', exact: true},
  {to: '/admin', label: 'Admin', exact: true, icon: 'settings'},
];

export function Topbar({
  searchValue,
  onSearchChange,
  showAddButton,
  onAddClick,
  onMenuClick,
  showMenuButton,
  isAuthenticated,
}: TopbarProps) {
  const navLinks = isAuthenticated ? [...publicLinks, ...adminLinks] : publicLinks;
  return (
    <header className="sticky top-0 z-[100] border-b border-border bg-bg">
      <div className="flex h-14 items-center gap-3 px-4 md:gap-4 md:px-8">
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

        <nav className="ml-auto hidden items-center gap-1 md:flex md:gap-2">
          {navLinks.map(({to, label, exact, icon}) => (
            <Link
              key={to}
              to={to}
              aria-label={icon === 'settings' ? label : undefined}
              className={
                icon === 'settings'
                  ? 'flex h-8 w-8 items-center justify-center rounded-md border-[1.5px] border-border text-text-muted transition-colors hover:border-accent hover:bg-bg-subtle hover:text-accent'
                  : 'rounded-[5px] px-3 py-1.5 text-[0.8rem] font-medium text-text-muted transition-colors hover:bg-bg-subtle hover:text-text'
              }
              activeProps={{
                className: icon === 'settings' ? '!border-accent !text-accent' : '!text-accent',
              }}
              activeOptions={{exact}}
            >
              {icon === 'settings' ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              ) : (
                label
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
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
      </div>

      <div className="flex items-center justify-center gap-1 border-t border-border px-4 py-1.5 md:hidden">
        <nav className="flex gap-1">
          {navLinks.map(({to, label, exact, icon}) => (
            <Link
              key={to}
              to={to}
              aria-label={icon === 'settings' ? label : undefined}
              className={
                icon === 'settings'
                  ? 'flex h-8 w-8 items-center justify-center rounded-md border-[1.5px] border-border text-text-muted transition-colors hover:border-accent hover:bg-bg-subtle hover:text-accent'
                  : 'rounded-[5px] px-3 py-1 text-[0.8rem] font-medium text-text-muted transition-colors hover:bg-bg-subtle hover:text-text'
              }
              activeProps={{
                className: icon === 'settings' ? '!border-accent !text-accent' : '!text-accent',
              }}
              activeOptions={{exact}}
            >
              {icon === 'settings' ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              ) : (
                label
              )}
            </Link>
          ))}
        </nav>

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
    </header>
  );
}
