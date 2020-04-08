import React from 'react';

import {compose} from '@truefit/bach';
import {withStyles} from '@truefit/bach-material-ui';
import {CircularProgress, Theme} from '@material-ui/core';

type Props = {
  classes: {
    loadingContainer: string;
  };
};

const Loading = ({classes}: Props) => (
  <div className={classes.loadingContainer}>
    <CircularProgress />
  </div>
);

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
});

export default compose(withStyles(styles))(Loading);
