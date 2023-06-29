import {useCallback, useMemo, useState} from 'react';
import {ArrowUpCircle, ArrowDownCircle} from 'lucide-react';

export function ArrowToggle() {
  const [flag, setFlag] = useState(false);
  const handleToggle = useCallback(() => {
    setFlag(!flag);
  }, [flag]);

  const Arrow = useMemo(() => (flag ? ArrowUpCircle : ArrowDownCircle), [flag]);

  return <Arrow size={24} color="#fff" onClick={handleToggle} />;
}
