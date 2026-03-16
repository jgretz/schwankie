import * as React from 'react';
import {Slot} from '@radix-ui/react-slot';
import {cva, type VariantProps} from 'class-variance-authority';

import {cn} from '@www/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap font-sans text-[0.82rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-accent text-white hover:bg-accent-hover',
        outline: 'border border-border bg-transparent text-text-muted hover:bg-bg-subtle',
        ghost: 'bg-transparent hover:bg-bg-subtle',
        link: 'text-accent underline-offset-4 hover:underline',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        default: 'px-4 py-[7px] rounded-[5px]',
        sm: 'px-3 py-1 rounded-[5px] text-xs',
        lg: 'px-6 py-2.5 rounded-[5px] text-sm',
        icon: 'h-8 w-8 rounded-[5px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {className, variant, size, asChild = false, ...props},
  ref,
) {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({variant, size, className}))} ref={ref} {...props} />;
});
Button.displayName = 'Button';

export {Button, buttonVariants};
