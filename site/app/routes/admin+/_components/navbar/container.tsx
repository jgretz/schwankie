import {Link} from '@remix-run/react';
import {Home} from 'lucide-react';

export function Navbar() {
  return (
    <div className="flex justify-center items-center">
      <div className="h-full rounded-b-lg w-full w-max-full mx-0.5 xl:w-3/4 xl:mx-auto bg-fore_black drop-shadow-md py-5">
        <div className="ml-5">
          <Link to="/">
            <Home />
          </Link>
        </div>
      </div>
    </div>
  );
}
