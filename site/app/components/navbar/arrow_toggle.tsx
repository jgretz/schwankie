import {useCallback, useMemo, useState} from 'react';
import {ArrowUpCircle, ArrowDownCircle} from 'lucide-react';
import {Button} from '~/components/ui/button';

export function ArrowToggle() {
  const [flag, setFlag] = useState(false);
  const handleToggle = useCallback(() => {
    setFlag(!flag);
  }, [flag]);

  const Arrow = useMemo(() => (flag ? ArrowUpCircle : ArrowDownCircle), [flag]);

  return (
    <Button variant="ghost" onClick={handleToggle}>
      <Arrow size={24} color="#fff" />
    </Button>
  );
}
