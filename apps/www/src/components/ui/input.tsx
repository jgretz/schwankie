import * as React from 'react';

import {cn} from '@www/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  {className, type, ...props},
  ref,
) {
  return (
    <input
      type={type}
      className={cn(
        'flex w-full rounded-md border border-border bg-bg px-[10px] py-2 font-sans text-sm text-text transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-faint focus-visible:border-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export {Input};
