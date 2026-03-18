import {useMemo} from 'react';

type HighlightTextProps = {
  text: string;
  query?: string;
};

export function splitHighlights(
  text: string,
  query: string,
): Array<{part: string; isMatch: boolean}> {
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const splitRegex = new RegExp(`(${escaped})`, 'gi');
  const matchRegex = new RegExp(`^${escaped}$`, 'i');
  return text.split(splitRegex).map((part) => ({part, isMatch: matchRegex.test(part)}));
}

export function HighlightText({text, query}: HighlightTextProps) {
  const parts = useMemo(() => {
    if (!query) return null;
    return splitHighlights(text, query).map((p, i) => ({...p, i}));
  }, [text, query]);

  if (!parts) return <>{text}</>;

  return (
    <>
      {parts.map(({part, i, isMatch}) =>
        isMatch ? (
          <mark key={i} className="rounded-sm bg-accent/20 px-[1px] font-medium text-text">
            {part}
          </mark>
        ) : (
          // index key is stable — parts are derived from a deterministic split
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}
