import {ArrowToggle} from './arrow_toggle';
import {Search} from './search';
import {Topics} from './topics';
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from '~/components/ui/collapsible';

export default function Navbar() {
  return (
    <div className="flex justify-center items-center">
      <div className="h-full rounded-b-lg w-3/4 bg-fore_black drop-shadow-md py-5">
        <Collapsible>
          <div className="flex flex-row items-center">
            <div className="w-1/6"></div>
            <Search />
            <CollapsibleTrigger className="flex justify-end w-1/6">
              <ArrowToggle />
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent className="CollapsibleContent">
            <Topics />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
