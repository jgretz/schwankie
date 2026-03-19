import {useCallback, useMemo} from 'react';
import {parseTagSlugs} from '@www/lib/parse-tag-slugs';

interface UseFeedNavigationParams {
  tags: string | undefined;
  q: string | undefined;
  extra?: Record<string, string | undefined>;
  navigate: (opts: {search: Record<string, string | undefined>}) => void;
}

export function useFeedNavigation({tags, q, extra = {}, navigate}: UseFeedNavigationParams) {
  const selectedTags = useMemo(() => parseTagSlugs(tags), [tags]);

  const handleTagClick = useCallback(
    (tagText: string) => {
      if (selectedTags.includes(tagText)) return;
      const next = [...selectedTags, tagText];
      navigate({search: {tags: next.join(','), q, ...extra}});
    },
    [selectedTags, navigate, q, extra],
  );

  const handleRemoveTag = useCallback(
    (tagText: string) => {
      const next = selectedTags.filter((t) => t !== tagText);
      navigate({
        search: {
          tags: next.length > 0 ? next.join(',') : undefined,
          q,
          ...extra,
        },
      });
    },
    [selectedTags, navigate, q, extra],
  );

  const handleClearAll = useCallback(() => {
    navigate({search: {q, ...extra}});
  }, [navigate, q, extra]);

  const handleClearSearch = useCallback(() => {
    navigate({search: {tags, q: undefined, ...extra}});
  }, [navigate, tags, extra]);

  return {
    selectedTags,
    handleTagClick,
    handleRemoveTag,
    handleClearAll,
    handleClearSearch,
  };
}
