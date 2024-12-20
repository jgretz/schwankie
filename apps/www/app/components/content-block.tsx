import type {HasChildrenProps} from '@www/types';

export default function ContentBlock({children}: HasChildrenProps) {
  return <div className="my-2 p-3 rounded-md bg-accent">{children}</div>;
}
