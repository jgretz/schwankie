import React from 'react';

import {compose} from '@truefit/bach';
import {withSelector} from '@truefit/bach-redux';
import {withStyles} from '@truefit/bach-material-ui';
import {renderIf} from '@truefit/bach-recompose';

import {CircularProgress, Theme} from '@material-ui/core';

import {loadingSelector, linksSelector} from '../selectors';
import {Link} from '../types';

type Props = {
  classes: {
    loadingContainer: string;
  };

  loading: boolean;
  links: Link[];
};

const Loading = ({classes}: Props) => (
  <div className={classes.loadingContainer}>
    <CircularProgress />
  </div>
);

const List = ({links}: Props) => (
  <ul>
    {links.map((link) => (
      <li key={link.id}>{link.title}</li>
    ))}
  </ul>
);

// handlers
const renderLoading = ({loading}: Props) => loading;

// styles
const styles = (theme: Theme) => ({
  loadingContainer: {
    display: 'flex',
    '& > * + *': {
      marginLeft: theme.spacing(2),
    },
  },
});

// compose
export default compose(
  withSelector('loading', loadingSelector),
  withSelector('links', linksSelector),

  withStyles(styles),

  renderIf(renderLoading, Loading),
)(List);
