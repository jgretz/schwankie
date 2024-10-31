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

  const handleSearch = useCallback(() => {
    console.log(search);
    window.location.href = `?query=${search}`;
  }, [search]);

  return (
    <div className="flex flex-row pb-3">
      <input
        className="w-full rounded-md text-primary px-1"
        defaultValue={search}
        onChange={handleSearchTextChange}
      />
      <button className="ml-2 bg-primary text-text rounded-md p-2" onClick={handleSearch}>
        Search
      </button>
    </div>
  );
}
