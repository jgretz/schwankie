import {useCallback, useState, type SetStateAction} from 'react';

interface Props {
  initialQuery?: string;
}

export default function Search({initialQuery}: Props) {
  const [search, setSearch] = useState(initialQuery || '');

  const handleSearchTextChange = useCallback(
    (e: {target: {value: SetStateAction<string>}}) => {
      setSearch(e.target.value);
    },
    [search],
  );

  const handleSearch = useCallback(
    (e: {preventDefault: () => void}) => {
      e.preventDefault();

      window.location.href = `?query=${search}`;
    },
    [search],
  );

  return (
    <form className="flex flex-row pb-3" onSubmit={handleSearch}>
      <input
        className="w-full rounded-md text-primary px-1"
        defaultValue={search}
        onChange={handleSearchTextChange}
      />
      <button className="ml-2 bg-primary text-text rounded-md p-2" type="submit">
        Search
      </button>
    </form>
  );
}
