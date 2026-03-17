import {useCallback, useEffect, useState} from 'react';

type Theme = 'light' | 'dark' | 'system';

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  const resolved = theme === 'system' ? getSystemTheme() : theme;
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const stored = localStorage.getItem('schwankie-theme') as Theme | null;
    const initial = stored ?? 'system';
    setTheme(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    function handleChange() {
      if (theme === 'system') applyTheme('system');
    }
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, [theme, mounted]);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const resolved = prev === 'system' ? getSystemTheme() : prev;
      const next = resolved === 'light' ? 'dark' : 'light';
      localStorage.setItem('schwankie-theme', next);
      applyTheme(next);
      return next;
    });
  }, []);

  // Render empty placeholder during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <button
        type="button"
        className="flex h-[30px] w-[30px] items-center justify-center rounded-md border-[1.5px] border-border text-text-muted transition-colors hover:border-accent hover:bg-bg-subtle hover:text-accent"
        aria-label="Toggle theme"
      />
    );
  }

  const resolved = theme === 'system' ? getSystemTheme() : theme;

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex h-[30px] w-[30px] items-center justify-center rounded-md border-[1.5px] border-border text-text-muted transition-colors hover:border-accent hover:bg-bg-subtle hover:text-accent"
      aria-label={`Switch to ${resolved === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${resolved === 'light' ? 'dark' : 'light'} mode`}
    >
      {resolved === 'light' ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}
    </button>
  );
}
