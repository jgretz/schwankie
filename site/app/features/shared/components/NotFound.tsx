import React from 'react';
import {compose} from '@truefit/bach';
import {withStyles} from '@truefit/bach-material-ui';

import {Grid, Typography} from '@material-ui/core';
import {Theme} from '@material-ui/core/styles/createMuiTheme';

type Props = {
  classes: {
    container: string;
  };
};

const NotFound = ({classes}: Props) => {
  return (
    <Grid container className={classes.container}>
      <Typography variant="h1">404 - Not Found</Typography>
    </Grid>
  );
};

export default compose(
  withStyles((theme: Theme) => ({
    container: {
      padding: theme.spacing(3),
    },
  })),
)(NotFound);
