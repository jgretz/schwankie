import {useEffect, useState} from 'react';
import {Toaster as Sonner} from 'sonner';

export function Toaster() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  useEffect(() => {
    const stored = localStorage.getItem('schwankie-theme') as 'light' | 'dark' | null;
    if (stored) setTheme(stored);
  }, []);
  return (
    <Sonner
      position="bottom-right"
      theme={theme}
      richColors
      toastOptions={{
        className: 'font-sans text-[0.85rem] rounded-md border border-border shadow-md',
      }}
    />
  );
}
