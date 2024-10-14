import type {HasChildrenProps} from '@www/Types';

export default function ContentBlock({children}: HasChildrenProps) {
  return <div className="my-2">{children}</div>;
}
