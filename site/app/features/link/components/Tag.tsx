import React from 'react';

import {compose, withMemo, withCallback} from '@truefit/bach';
import {withActions} from '@truefit/bach-redux';
import {withStyles} from '@truefit/bach-material-ui';

import Typography from '@material-ui/core/Typography';
import {Theme} from '@material-ui/core';

import {setSearchTerm} from '../../search/actions';

type PublicProps = {
  tag: string;
  comma: boolean;
};

type InternalProps = {
  classes: {
    link: string;
  };

  text: string;

  setSearchTerm: (term: string) => void;
  handleClick: () => void;
};

type Props = PublicProps & InternalProps;

const Tag = ({classes, text, handleClick}: Props) => (
  <Typography className={classes.link} variant="subtitle2" onClick={handleClick}>
    {text}
  </Typography>
);

const makeText = ({tag, comma}: Props) => (comma ? `${tag},` : tag);

const handleClick = ({tag, setSearchTerm}: Props) => () => {
  setSearchTerm(tag);
};

const styles = (theme: Theme) => ({
  link: {
    marginRight: 2,
    color: theme.palette.primary.main,
    cursor: 'pointer',
  },
});

export default compose<PublicProps>(
  withMemo('text', makeText, ['tag']),

  withActions({setSearchTerm}),
  withCallback('handleClick', handleClick),

  withStyles(styles),
)(Tag);
