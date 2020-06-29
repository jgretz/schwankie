/* eslint-disable react/destructuring-assignment */
import React from 'react';

import {compose, withCallback} from '@truefit/bach';
import {withStyles} from '@truefit/bach-material-ui';

import {Theme} from '@material-ui/core';
import {CSSProperties} from '@material-ui/styles';
import IconButton from '@material-ui/core/IconButton';
import OpenInBrowserIcon from '@material-ui/icons/OpenInBrowser';
import FileCopyIcon from '@material-ui/icons/FileCopy';

import copy from 'copy-to-clipboard';
import {
  withSnackbar,
  EnqueueSnackbarFunction,
  EnqueueSnackbarVariant,
} from '../../shared/enhancers';

import {Link} from '../types';

type PublicProps = {
  link: Link;
};

type InternalProps = {
  classes: {
    container: string;
    link: string;
    copyButton: string;
    visitButton: string;
  };

  enqueueSnackbar: EnqueueSnackbarFunction;
  handleCopyClick: () => void;
};

type Props = PublicProps & InternalProps;

const CopyButton = ({classes, handleCopyClick}: Props) => (
  <IconButton className={classes.copyButton} onClick={handleCopyClick}>
    <FileCopyIcon />
  </IconButton>
);

const VisitButton = ({classes, link}: Props) => (
  <a className={classes.link} href={link.url} target="_blank" rel="noopener">
    <IconButton className={classes.visitButton}>
      <OpenInBrowserIcon />
    </IconButton>
  </a>
);

const Buttons = (props: Props) => (
  <div className={props.classes.container}>
    <CopyButton {...props} />
    <VisitButton {...props} />
  </div>
);

const handleCopyClick = ({link, enqueueSnackbar}: Props) => () => {
  copy(link.url);
  enqueueSnackbar(`Link for ${link.title} copied to clipboard`, {
    variant: EnqueueSnackbarVariant.Success,
    autoHideDuration: 2500,
  });
};

const styles = (theme: Theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: -38,
  } as CSSProperties,

  visitButton: {
    marginLeft: 10,

    backgroundColor: theme.palette.primary.main,
  },
  copyButton: {
    backgroundColor: theme.palette.grey[700],
  },
});

export default compose<PublicProps>(
  withSnackbar(),
  withCallback('handleCopyClick', handleCopyClick),
  withStyles(styles),
)(Buttons);
