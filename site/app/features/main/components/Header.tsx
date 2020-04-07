import React from 'react';
import {compose} from '@truefit/bach';
import {withStyles} from '@truefit/bach-material-ui';

import {Search} from '../../search/components';
import About from './About';
import {AdminGear} from '../../admin/components';

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
      <AdminGear />
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
    justifyContent: 'space-around',

    height: 80,
    padding: 10,

    width: '100%',
  },
  iconContainer: {
    flex: 1,

    display: 'flex',

    width: 24,
    marginLeft: 16,
    marginRight: 16,
  },
  searchContainer: {
    flex: 3,

    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',

    marginTop: -5,
  },
};

export default compose(withStyles(styles))(Header);
