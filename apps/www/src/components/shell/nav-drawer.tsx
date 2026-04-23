import {Link} from '@tanstack/react-router';
import {useEffect, useRef} from 'react';
import {cn} from '@www/lib/utils';
import {sections} from './sections';
import {TagList} from './tag-list';
import type {CurrentSection, Tag} from './types';

type NavDrawerProps = {
  currentSection: CurrentSection;
  isAuthenticated: boolean;
  tags: Tag[];
  selectedTags: string[];
  onTagToggle: (tagText: string) => void;
  isOpen: boolean;
  onClose: () => void;
};

const TAG_SECTIONS: readonly CurrentSection[] = ['queue', 'public'];

export function NavDrawer({
  currentSection,
  isAuthenticated,
  tags,
  selectedTags,
  onTagToggle,
  isOpen,
  onClose,
}: NavDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const showTags = TAG_SECTIONS.includes(currentSection);

  useEffect(
    function trapFocusAndEscape() {
      if (!isOpen) return;

      function handleKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape') {
          onClose();
          return;
        }

        if (e.key !== 'Tab' || !drawerRef.current) return;

        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }

      document.addEventListener('keydown', handleKeyDown);
      drawerRef.current?.querySelector<HTMLElement>('button')?.focus();

      return () => document.removeEventListener('keydown', handleKeyDown);
    },
    [isOpen, onClose],
  );

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-[200] bg-black/40 dark:bg-black/60 transition-opacity duration-200',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className={cn(
          'fixed left-0 top-0 z-[201] h-full w-[280px] overflow-y-auto bg-bg shadow-lg transition-transform duration-200',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="font-serif text-sm font-semibold text-text">
            {isAuthenticated ? 'Navigation' : 'Filters'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-subtle hover:text-text"
            aria-label="Close navigation"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          {isAuthenticated && (
            <nav className="flex flex-col gap-1">
              {sections.map(({id, label, to}) => (
                <Link
                  key={id}
                  to={to}
                  onClick={onClose}
                  className={cn(
                    'rounded-[5px] px-2 py-[7px] text-sm font-medium text-text-muted transition-colors hover:bg-bg-subtle hover:text-text',
                    currentSection === id && 'border-l-2 border-accent bg-bg-subtle text-accent',
                  )}
                  activeProps={{
                    className: 'border-l-2 border-accent bg-bg-subtle text-accent',
                  }}
                  activeOptions={{exact: false}}
                >
                  {label}
                </Link>
              ))}
            </nav>
          )}

          {showTags && (
            <div className={cn(isAuthenticated && 'mt-5 border-t border-border pt-5', 'md:hidden')}>
              <TagList tags={tags} selectedTags={selectedTags} onTagToggle={onTagToggle} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
