import {Search as SearchIcon} from 'lucide-react';
import {Button} from '~/components/ui/button';
import {Input} from '~/components/ui/input';

export function Search() {
  return (
    <div className="flex flex-row flex-grow justify-center">
      <Input type="test" placeholder="Search" />
      <Button variant="ghost">
        <SearchIcon size={32} color="#fff" />
      </Button>
    </div>
  );
}
