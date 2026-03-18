import {type ReactNode, useState} from 'react';
import {MobileDrawer} from './mobile-drawer';
import {Sidebar} from './sidebar';
import {Topbar} from './topbar';
import type {Tag} from './types';

type AppShellProps = {
  children: ReactNode;
  tags: Tag[];
  selectedTags: string[];
  onTagToggle: (tagText: string) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  showAddButton: boolean;
  onAddClick: () => void;
  isAuthenticated?: boolean;
};

export function AppShell({
  children,
  tags,
  selectedTags,
  onTagToggle,
  searchValue,
  onSearchChange,
  showAddButton,
  onAddClick,
  isAuthenticated,
}: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <Topbar
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        showAddButton={showAddButton}
        onAddClick={onAddClick}
        showMenuButton={true}
        isAuthenticated={isAuthenticated}
        onMenuClick={() => setDrawerOpen(true)}
      />

      <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-[1200px]">
        <Sidebar tags={tags} selectedTags={selectedTags} onTagToggle={onTagToggle} />

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <MobileDrawer
        tags={tags}
        selectedTags={selectedTags}
        onTagToggle={onTagToggle}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
