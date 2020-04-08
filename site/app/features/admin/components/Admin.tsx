import React from 'react';
import {compose, withCallback} from '@truefit/bach';
import {withSelector, withActions} from '@truefit/bach-redux';
import {renderIf} from '@truefit/bach-recompose';
import {withStyles} from '@truefit/bach-material-ui';

import {Link} from 'react-router-dom';
import {Theme} from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import ArrowBack from '@material-ui/icons/ArrowBack';
import {CSSProperties} from '@material-ui/styles';
import AdminLogin from './AdminLogin';
import AdminLink from './AdminLink';

import {setSearchTerm} from '../../search/actions';
import {userSelector} from '../selectors';

import {User} from '../types';

type Props = {
  classes: {
    container: string;

    iconContainer: string;
    icon: string;

    titleContainer: string;
    title: string;
  };

  user: User;

  setSearchTerm: (term: string) => void;
  onBackClick: () => void;
};

const shouldRenderLogin = ({user}: Props) => !user;

const Content = compose(
  withSelector('user', userSelector),
  renderIf(shouldRenderLogin, AdminLogin),
)(AdminLink);

const Admin = ({classes, onBackClick}: Props) => (
  <div>
    <div className={classes.container}>
      <div className={classes.iconContainer}>
        <Link to="/" onClick={onBackClick}>
          <ArrowBack className={classes.icon} />
        </Link>
      </div>
      <div className={classes.titleContainer}>
        <Typography className={classes.title} variant="h4">
          Admin
        </Typography>
      </div>
      <div className={classes.iconContainer} />
    </div>
    <Content />
  </div>
);

const onBackClick = ({setSearchTerm}: Props) => () => {
  setSearchTerm('');
};

const styles = (theme: Theme) => ({
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',

    height: 80,
    padding: 10,

    width: '100%',
  } as CSSProperties,
  iconContainer: {
    flex: 1,

    display: 'flex',
    justifyContent: 'flex-end',

    width: 24,
    marginLeft: 16,
    marginRight: 16,
  } as CSSProperties,
  titleContainer: {
    flex: 3,

    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  } as CSSProperties,
  icon: {
    color: theme.palette.primary.main,
  },
});

export default compose(
  withActions({setSearchTerm}),
  withCallback('onBackClick', onBackClick),
  withStyles(styles),
)(Admin);
