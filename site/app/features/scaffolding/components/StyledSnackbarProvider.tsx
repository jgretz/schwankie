import React, {ReactElement} from 'react';
import {SnackbarProvider} from 'notistack';
import {compose} from '@truefit/bach';
import {withStyles} from '@truefit/bach-material-ui';

type Props = {
  classes: {
    variantSuccess: string;
    variantError: string;
    variantWarning: string;
    variantInfo: string;
  };
  children: ReactElement<unknown>;
};

const StyledSnackbarProvider = ({classes, children}: Props) => (
  <SnackbarProvider classes={classes}>{children}</SnackbarProvider>
);

export default compose(
  withStyles(() => ({
    variantSuccess: {},
    variantError: {},
    variantWarning: {},
    variantInfo: {},
  })),
)(StyledSnackbarProvider);
