import {Toaster as Sonner} from 'sonner';

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      theme="system"
      richColors
      toastOptions={{
        className: 'font-sans text-[0.85rem] rounded-md border border-border shadow-md',
      }}
    />
  );
}
