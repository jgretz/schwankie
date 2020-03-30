import React from 'react';
import {compose} from '@truefit/bach';
import {withStyles} from '@truefit/bach-material-ui';

import InfoIcon from '@material-ui/icons/Info';
import GearIcon from '@material-ui/icons/Settings';
import {Link} from 'react-router-dom';
import {Theme} from '@material-ui/core';
import Search from './Search';

type Props = {
  classes: {
    container: string;
    searchContainer: string;
    iconContainer: string;
    iconLink: string;
    adminLink: string;
  };
};

const Header = ({classes}: Props) => (
  <div className={classes.container}>
    <div className={classes.iconContainer}>
      <Link to="/admin" className={classes.iconLink}>
        <GearIcon className={classes.adminLink} />
      </Link>
    </div>
    <div className={classes.searchContainer}>
      <Search />
    </div>
    <div className={classes.iconContainer}>
      <Link to="/about" className={classes.iconLink}>
        <InfoIcon />
      </Link>
    </div>
  </div>
);

const styles = (theme: Theme) => ({
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
  iconLink: {
    color: theme.palette.primary.main,
  },
  adminLink: {
    display: 'none',
  },
});

export default compose(withStyles(styles))(Header);
