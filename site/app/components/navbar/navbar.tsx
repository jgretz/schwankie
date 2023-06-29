import {Collapsible, CollapsibleContent, CollapsibleTrigger} from '~/components/ui/collapsible';
import {TagsList} from '~/routes/resources/tags_list/route';
import {ArrowToggle} from '~/components/arrow_toggle/arrow_toggle';
import {Search} from '../search/search';

export function Navbar() {
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
            <TagsList />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
