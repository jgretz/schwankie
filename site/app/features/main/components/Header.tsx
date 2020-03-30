import React from 'react';
import {compose} from '@truefit/bach';
import {withStyles} from '@truefit/bach-material-ui';

import InfoIcon from '@material-ui/icons/Info';
import GearIcon from '@material-ui/icons/Settings';
import {Link} from 'react-router-dom';
import Search from './Search';

type Props = {
  classes: {
    container: string;
    searchContainer: string;
    iconContainer: string;
  };
};

const Header = ({classes}: Props) => (
  <div className={classes.container}>
    <div className={classes.searchContainer}>
      <Search />
    </div>
    <div className={classes.iconContainer}>
      <Link to="/about">
        <InfoIcon />
      </Link>
      <Link to="/admin">
        <GearIcon />
      </Link>
    </div>
  </div>
);

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',

    height: 80,
    padding: 10,

    width: '100%',
  },
  searchContainer: {
    flex: 1,

    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    flex: 0,
    display: 'flex',
  },
};

export default compose(withStyles(styles))(Header);
