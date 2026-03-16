import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  useNavigate,
  useSearch,
} from '@tanstack/react-router';
import {createServerFn} from '@tanstack/react-start';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {LinkModal} from '@www/components/modal/link-modal';
import {LinkModalProvider} from '@www/components/modal/link-modal-context';
import {AppShell} from '@www/components/shell/app-shell';
import {useTags} from '@www/hooks/use-tags';
import type {LinkData} from '@www/lib/api-client';
import {parseTagIds} from '@www/lib/parse-tag-ids';
import type {FeedSearch} from '@www/routes/index';
import '../globals.css';
import {destroySession, getAuthState} from '../lib/session';

export const logout = createServerFn({method: 'POST'}).handler(async () => {
  await destroySession();
  throw new Response(null, {status: 302, headers: {Location: '/'}});
});

export const Route = createRootRoute({
  notFoundComponent: NotFound,
  beforeLoad: async () => {
    const auth = await getAuthState();
    return {auth};
  },
  head: () => ({
    meta: [{charSet: 'utf-8'}, {name: 'viewport', content: 'width=device-width, initial-scale=1'}],
    links: [
      {rel: 'preconnect', href: 'https://fonts.googleapis.com'},
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap',
      },
    ],
  }),
  component: RootComponent,
});

function NotFound() {
  return (
    <div className="mx-auto max-w-[1200px] px-8 py-16">
      <h1 className="font-serif text-4xl text-text">404</h1>
    </div>
  );
}

type ModalState =
  | {open: false}
  | {open: true; mode: 'add'}
  | {open: true; mode: 'edit'; link: LinkData};

function RootComponent() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <ShellWithData />
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  );
}

function ShellWithData() {
  const navigate = useNavigate();
  const {auth} = Route.useRouteContext();
  const isAuthenticated = auth.authenticated;

  const search = useSearch({strict: false}) as FeedSearch;
  const tagsParam = search.tags;
  const qParam = search.q ?? '';

  const selectedTagIds = useMemo(() => parseTagIds(tagsParam), [tagsParam]);

  const {data: tags} = useTags('saved');

  // Debounced search
  const [searchValue, setSearchValue] = useState(qParam);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearchValue(qParam);
  }, [qParam]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        navigate({
          to: '/',
          search: {tags: tagsParam, q: value || undefined},
        });
      }, 300);
    },
    [navigate, tagsParam],
  );

  const handleTagToggle = useCallback(
    (tagId: number) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const next = selectedTagIds.includes(tagId)
        ? selectedTagIds.filter((id) => id !== tagId)
        : [...selectedTagIds, tagId];
      navigate({
        to: '/',
        search: {tags: next.length > 0 ? next.join(',') : undefined, q: search.q},
      });
    },
    [selectedTagIds, navigate, search.q],
  );

  // Modal state
  const [modal, setModal] = useState<ModalState>({open: false});

  const openAddModal = useCallback(() => setModal({open: true, mode: 'add'}), []);
  const openEditModal = useCallback(
    (link: LinkData) => setModal({open: true, mode: 'edit', link}),
    [],
  );
  const closeModal = useCallback(() => setModal({open: false}), []);

  const modalContext = useMemo(() => ({openEdit: openEditModal}), [openEditModal]);

  return (
    <LinkModalProvider value={modalContext}>
      <AppShell
        tags={tags ?? []}
        selectedTagIds={selectedTagIds}
        onTagToggle={handleTagToggle}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        showAddButton={isAuthenticated}
        onAddClick={openAddModal}
      >
        <Outlet />
      </AppShell>

      {isAuthenticated && (
        <LinkModal
          mode={modal.open ? modal.mode : 'add'}
          isOpen={modal.open}
          onClose={closeModal}
          editLink={modal.open && modal.mode === 'edit' ? modal.link : undefined}
        />
      )}
    </LinkModalProvider>
  );
}
