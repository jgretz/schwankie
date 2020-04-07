import React from 'react';

import {compose} from '@truefit/bach';
import {withSelector} from '@truefit/bach-redux';
import {renderIf} from '@truefit/bach-recompose';
import {withStyles} from '@truefit/bach-material-ui';

import GearIcon from '@material-ui/icons/Settings';
import {Link} from 'react-router-dom';
import {Theme} from '@material-ui/core';

import {userSelector} from '../selectors';
import {User} from '../types';

type Props = {
  classes: {
    container: string;
    link: string;
    icon: string;
  };

  user: User;
};

const Empty = (): React.ReactNode => null;

const AdminGear = ({classes}: Props) => (
  <div className={classes.container}>
    <Link to="/admin" className={classes.link}>
      <GearIcon className={classes.icon} />
    </Link>
  </div>
);

const shouldRenderGear = ({user}: Props) => !user;

const styles = (theme: Theme) => ({
  container: {
    width: '100%',

    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',

    paddingTop: 8,
  },
  link: {
    textDecoration: 'none',
  },
  icon: {
    color: theme.palette.primary.main,
  },
});

export default compose(
  withSelector('user', userSelector),
  withStyles(styles),

  renderIf(shouldRenderGear, Empty),
)(AdminGear);
