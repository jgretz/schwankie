import {Collapsible, CollapsibleContent, CollapsibleTrigger} from '~/components/ui/collapsible';
import {ArrowToggle} from './arrow_toggle';
import {Search} from './search';
import {TagPane} from './tag_pane';

export function Navbar() {
  return (
    <div className="flex justify-center items-center">
      <div className="h-full rounded-b-lg w-full w-max-full mx-0.5 xl:w-3/4 xl:mx-auto bg-fore_black drop-shadow-md py-5">
        <Collapsible>
          <div className="flex flex-row items-center">
            <div className="w-1/6"></div>
            <Search />
            <CollapsibleTrigger className="flex justify-end mr-5 w-1/6">
              <ArrowToggle />
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent className="CollapsibleContent">
            <TagPane />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
