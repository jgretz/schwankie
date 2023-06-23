import type {TagListItem} from '~/Types';
import {ArrowToggle} from './arrow_toggle';
import {Search} from './search';
import {Tags} from './tags';
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from '~/components/ui/collapsible';

interface Props {
  mainTags: TagListItem[];
  topTags: TagListItem[];
  recentTags: TagListItem[];
}

export default function Navbar(props: Props) {
  return (
    <div className="flex justify-center items-center">
      <div className="h-full rounded-b-lg w-3/4 bg-fore_black drop-shadow-md py-5">
        <Collapsible>
          <div className="flex flex-row items-center">
            <div className="w-1/6"></div>
            <Search />
            <CollapsibleTrigger className="flex justify-end mr-5 w-1/6">
              <ArrowToggle />
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent className="CollapsibleContent">
            <Tags {...props} />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
