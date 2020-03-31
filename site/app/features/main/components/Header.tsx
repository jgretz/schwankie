import React from 'react';
import {compose} from '@truefit/bach';
import {withStyles} from '@truefit/bach-material-ui';

import GearIcon from '@material-ui/icons/Settings';
import {Link} from 'react-router-dom';

import Search from './Search';
import About from './About';

type Props = {
  classes: {
    container: string;
    searchContainer: string;
    iconContainer: string;
    adminLink: string;
  };
};

const Header = ({classes}: Props) => (
  <div className={classes.container}>
    <div className={classes.iconContainer}>
      <Link to="/admin">
        <GearIcon className={classes.adminLink} />
      </Link>
    </div>
    <div className={classes.searchContainer}>
      <Search />
    </div>
    <div className={classes.iconContainer}>
      <About />
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
  adminLink: {
    display: 'none',
  },
};

export default compose(withStyles(styles))(Header);
