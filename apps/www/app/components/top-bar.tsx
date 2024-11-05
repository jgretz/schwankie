import {description} from '@www/constants/seo.constants';

import ThemeSwitch from '@www/routes/resources+/theme-switch';
import {useTheme} from '@www/hooks/useTheme';
import {Link} from '@remix-run/react';

export default function TopBar() {
  const theme = useTheme();

  return (
    <div className="flex flex-row justify-between px-5 pt-2 pb-1 bg-primary b-shad text-text">
      <div>
        <Link to="/">{description()}</Link>
      </div>
      <div className="flex flex-row">
        <div>
          <Link to="/about">About</Link>
        </div>
        <div className="flex flex-row border-l-2 border-secondary ml-2 pl-2 justify-center items-center">
          <ThemeSwitch userPreference={theme} />
        </div>
      </div>
    </div>
  );
}
