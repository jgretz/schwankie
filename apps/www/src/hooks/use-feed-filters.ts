import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate, useRouterState, useSearch} from '@tanstack/react-router';
import {useTags} from '@www/hooks/use-tags';
import {parseTagSlugs} from '@www/lib/parse-tag-slugs';
import type {CurrentSection} from '@www/components/shell/types';
import type {FeedSearch} from '@www/routes/index';

export function useFeedFilters(): {
  tags: Array<{id: number; text: string; count: number}>;
  selectedTags: string[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  onTagToggle: (tagText: string) => void;
  currentSection: CurrentSection;
} {
  const navigate = useNavigate();

  const pathname = useRouterState({select: (s) => s.location.pathname});

  const currentSection = pathname.startsWith('/admin')
    ? 'admin'
    : pathname === '/queue'
      ? 'queue'
      : pathname.startsWith('/feeds')
        ? 'feeds'
        : pathname.startsWith('/email')
          ? 'emails'
          : 'public';

  const status = pathname === '/queue' ? 'queued' : 'saved';
  const currentPath = pathname === '/queue' ? '/queue' : '/';

  const search = useSearch({strict: false}) as FeedSearch;
  const tagsParam = search.tags;
  const qParam = search.q ?? '';

  const selectedTags = useMemo(() => parseTagSlugs(tagsParam), [tagsParam]);

  const {data: tags} = useTags(status);

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

  const onSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        navigate({
          to: currentPath,
          search: {tags: tagsParam, q: value || undefined},
        });
      }, 300);
    },
    [navigate, tagsParam, currentPath],
  );

  const onTagToggle = useCallback(
    (tagText: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const next = selectedTags.includes(tagText)
        ? selectedTags.filter((t) => t !== tagText)
        : [...selectedTags, tagText];
      navigate({
        to: currentPath,
        search: {tags: next.length > 0 ? next.join(',') : undefined, q: search.q},
      });
    },
    [selectedTags, navigate, search.q, currentPath],
  );

  return {
    tags: tags ?? [],
    selectedTags,
    searchValue,
    onSearchChange,
    onTagToggle,
    currentSection,
  };
}
