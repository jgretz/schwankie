import {Toaster as Sonner} from 'sonner';

export function Toaster() {
  const theme =
    (typeof window !== 'undefined'
      ? (localStorage.getItem('schwankie-theme') as 'light' | 'dark' | null)
      : null) ?? 'system';
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
