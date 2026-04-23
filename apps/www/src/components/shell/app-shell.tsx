import {type ReactNode, useEffect, useState} from 'react';
import {NavDrawer} from './nav-drawer';
import {Sidebar} from './sidebar';
import {Topbar} from './topbar';
import type {CurrentSection, Tag} from './types';

const DRAWER_STATE_KEY = 'schwankie-drawer-open';
const TAG_SECTIONS: readonly CurrentSection[] = ['queue', 'public'];

type AppShellProps = {
  children: ReactNode;
  currentSection: CurrentSection;
  tags: Tag[];
  selectedTags: string[];
  onTagToggle: (tagText: string) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  isAuthenticated: boolean;
  onAddClick: () => void;
};

export function AppShell({
  children,
  currentSection,
  tags,
  selectedTags,
  onTagToggle,
  searchValue,
  onSearchChange,
  isAuthenticated,
  onAddClick,
}: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(function loadDrawerState() {
    try {
      const stored = localStorage.getItem(DRAWER_STATE_KEY);
      if (stored === 'true') setDrawerOpen(true);
    } catch {
      // localStorage unavailable (SSR / privacy mode) — ignore
    }
  }, []);

  useEffect(
    function persistDrawerState() {
      try {
        localStorage.setItem(DRAWER_STATE_KEY, String(drawerOpen));
      } catch {
        // localStorage unavailable — ignore
      }
    },
    [drawerOpen],
  );

  const hasTagDrawer = TAG_SECTIONS.includes(currentSection);
  // Auth users: drawer hosts menu (desktop + mobile). Unauth users: drawer hosts
  // tag filter on mobile only (desktop uses the sidebar).
  const showMenuButton = isAuthenticated || hasTagDrawer;

  return (
    <>
      <Topbar
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        showAddButton={isAuthenticated}
        onAddClick={onAddClick}
        showMenuButton={showMenuButton}
        menuButtonMobileOnly={!isAuthenticated}
        onMenuClick={() => setDrawerOpen((open) => !open)}
      />

      <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-[1200px]">
        <Sidebar
          currentSection={currentSection}
          tags={tags}
          selectedTags={selectedTags}
          onTagToggle={onTagToggle}
        />

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <NavDrawer
        currentSection={currentSection}
        isAuthenticated={isAuthenticated}
        tags={tags}
        selectedTags={selectedTags}
        onTagToggle={onTagToggle}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
