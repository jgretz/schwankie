import type {CurrentSection} from '@www/components/shell/types';

// The trailing fallback is 'public', which IS a tag section — a path without
// its own branch renders the tag sidebar and fires a needless tags query.
export function currentSectionFor(pathname: string): CurrentSection {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname === '/queue') return 'queue';
  if (pathname.startsWith('/feeds')) return 'feeds';
  if (pathname.startsWith('/email')) return 'emails';
  if (pathname.startsWith('/daily-summary')) return 'daily-summary';
  if (pathname.startsWith('/history')) return 'history';
  if (pathname === '/about') return 'about';
  return 'public';
}

export function isLinkSection(section: CurrentSection): boolean {
  return section === 'public' || section === 'queue';
}
