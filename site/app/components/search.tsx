import {useNavigate, useSearchParams} from '@remix-run/react';
import {Search as SearchIcon} from 'lucide-react';
import type {FormEvent} from 'react';
import {useCallback, useEffect, useState} from 'react';
import {Button} from '~/components/ui/button';
import {Input} from '~/components/ui/input';
import {appendParams} from '~/services/util/appendParams';
import {parseSearchParams} from '~/services/util/parseSearchParams';

export function Search() {
  const [searchParams] = useSearchParams();
  const {query, size} = parseSearchParams(searchParams);

  const [cachedQuery, setCachedQuery] = useState(query);
  const [term, setTerm] = useState(query);

  useEffect(() => {
    if (cachedQuery !== query) {
      setCachedQuery(query);
      setTerm(query);
    }
  }, [cachedQuery, query]);

  const handleTyping = useCallback(
    (event: React.FormEvent<HTMLInputElement>) => {
      setTerm(event.currentTarget.value);
    },
    [setTerm],
  );

  const navigate = useNavigate();

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const linkTo = appendParams('/?', [
        ['query', term],
        ['size', size],
      ]);

      navigate(linkTo);
    },
    [navigate, size, term],
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-row flex-grow justify-center">
      <Input name="term" type="text" placeholder="Search" value={term} onChange={handleTyping} />
      <Button variant="ghost" type="submit">
        <SearchIcon size={24} color="#fff" />
      </Button>
    </form>
  );
}
