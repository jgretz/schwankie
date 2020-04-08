import React from 'react';

import {compose} from '@truefit/bach';
import {withSelector} from '@truefit/bach-redux';
import {withStyles} from '@truefit/bach-material-ui';
import {renderIf} from '@truefit/bach-recompose';

import LinkCard from './LinkCard';
import {Loading} from '../../shared/components';

import {loadingSelector, linksSelector} from '../selectors';
import {Link} from '../types';

type Props = {
  classes: {
    listContainer: string;
  };

  loading: boolean;
  links: Link[];
};

const List = ({classes, links}: Props) => (
  <div className={classes.listContainer}>
    {links.map((link) => (
      <LinkCard key={link.id} link={link} />
    ))}
  </div>
);

const renderLoading = ({loading}: Props) => loading;

const styles = {
  listContainer: {
    display: 'flex',
    flexFlow: 'row wrap',

    justifyContent: 'center',

    marginLeft: 'auto',
    marginRight: 'auto',
  },
};

// compose
const ComposedList = compose(
  withSelector('links', linksSelector),

  withStyles(styles),
)(List);

export default compose(
  withSelector('loading', loadingSelector),
  renderIf(renderLoading, Loading),
)(ComposedList);
