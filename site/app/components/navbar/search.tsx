import {Search as SearchIcon} from 'lucide-react';
import {Button} from '~/components/ui/button';
import {Input} from '~/components/ui/input';

interface Props {
  query?: string;
}

export function Search({query}: Props) {
  return (
    <div className="flex flex-row flex-grow justify-center">
      <Input type="text" placeholder="Search" value={query} />
      <Button variant="ghost">
        <SearchIcon size={24} color="#fff" />
      </Button>
    </div>
  );
}
