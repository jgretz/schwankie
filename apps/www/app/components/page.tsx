import {cn} from '@www/utils/cn';
import {type ReactNode} from 'react';

interface Props {
  className?: string;
  children: ReactNode;
}

export default function Page({className, children}: Props) {
  const classes = cn('p-5 w-full', className);

  return <div className={classes}>{children}</div>;
}
