import {type ReactNode, useState} from 'react';
import {MobileDrawer} from './mobile-drawer';
import {Sidebar} from './sidebar';
import {Topbar} from './topbar';
import type {Tag} from './types';

type AppShellProps = {
  children: ReactNode;
  tags: Tag[];
  selectedTagIds: number[];
  onTagToggle: (tagId: number) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  showAddButton: boolean;
  onAddClick: () => void;
};

export function AppShell({
  children,
  tags,
  selectedTagIds,
  onTagToggle,
  searchValue,
  onSearchChange,
  showAddButton,
  onAddClick,
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
        onMenuClick={() => setDrawerOpen(true)}
      />

      <div className="mx-auto flex min-h-[calc(100vh-56px)] max-w-[1200px]">
        <Sidebar tags={tags} selectedTagIds={selectedTagIds} onTagToggle={onTagToggle} />

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <MobileDrawer
        tags={tags}
        selectedTagIds={selectedTagIds}
        onTagToggle={onTagToggle}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
