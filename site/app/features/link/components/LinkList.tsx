import React from 'react';

import {compose} from '@truefit/bach';
import {withSelector} from '@truefit/bach-redux';
import {withStyles} from '@truefit/bach-material-ui';
import {renderIf} from '@truefit/bach-recompose';

import {CircularProgress, Theme} from '@material-ui/core';
import LinkCard from './LinkCard';

import {loadingSelector, linksSelector} from '../selectors';
import {Link} from '../types';

type Props = {
  classes: {
    loadingContainer: string;
    listContainer: string;
  };

  loading: boolean;
  links: Link[];
};

const Loading = ({classes}: Props) => (
  <div className={classes.loadingContainer}>
    <CircularProgress />
  </div>
);

const List = ({classes, links}: Props) => (
  <div className={classes.listContainer}>
    {links.map((link) => (
      <LinkCard key={link.id} link={link} />
    ))}
  </div>
);

// handlers
const renderLoading = ({loading}: Props) => loading;

// styles
const styles = (theme: Theme) => ({
  loadingContainer: {
    height: '100vh',
    width: '100hw',

    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',

    '& > * + *': {
      marginLeft: theme.spacing(2),
    },
  },

  listContainer: {
    display: 'flex',
    flexFlow: 'row wrap',

    justifyContent: 'center',

    marginLeft: 'auto',
    marginRight: 'auto',
  },
});

// compose
export default compose(
  withSelector('loading', loadingSelector),
  withSelector('links', linksSelector),

  withStyles(styles),

  renderIf(renderLoading, Loading),
)(List);
