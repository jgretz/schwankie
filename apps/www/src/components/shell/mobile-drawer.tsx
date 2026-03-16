import {useEffect, useRef} from 'react';
import {cn} from '@www/lib/utils';
import {TagList} from './sidebar';
import type {Tag} from './types';

type MobileDrawerProps = {
  tags: Tag[];
  selectedTagIds: number[];
  onTagToggle: (tagId: number) => void;
  isOpen: boolean;
  onClose: () => void;
};

export function MobileDrawer({
  tags,
  selectedTagIds,
  onTagToggle,
  isOpen,
  onClose,
}: MobileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

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
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-[200] bg-black/40 transition-opacity duration-200',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Tag filters"
        className={cn(
          'fixed left-0 top-0 z-[201] h-full w-[280px] overflow-y-auto bg-bg shadow-lg transition-transform duration-200',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="font-serif text-sm font-semibold text-text">Filters</span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-subtle hover:text-text"
            aria-label="Close filters"
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
          <TagList tags={tags} selectedTagIds={selectedTagIds} onTagToggle={onTagToggle} />
        </div>
      </div>
    </>
  );
}
