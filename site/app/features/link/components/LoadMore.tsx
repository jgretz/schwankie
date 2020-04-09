import React from 'react';

import {compose, withState, withEffect, withCallback} from '@truefit/bach';
import {withActions, withSelector} from '@truefit/bach-redux';
import {withStyles} from '@truefit/bach-material-ui';
import {renderIf} from '@truefit/bach-recompose';

import {Theme, Button, CircularProgress} from '@material-ui/core';

import {PAGE_SIZE} from '../constants';
import {loadMoreRecentLinks} from '../actions';
import {loadingSelector, linksSelector} from '../selectors';
import {searchTermSelector} from '../../search/selectors';

import {Link} from '../types';

type Props = {
  classes: {
    container: string;
    button: string;
  };

  searchTerm: string;
  links: Link[];
  linksLoading: boolean;

  loading: boolean;
  setLoading: (value: boolean) => void;

  page: number;
  setPage: (value: number) => void;

  loadMoreRecentLinks: (count: number, page: number) => void;
  handleLoadMoreClick: () => void;
};

const Empty = (): React.ReactNode => null;

const Loading = ({classes}: Props) => (
  <div className={classes.container}>
    <CircularProgress />
  </div>
);

const LoadMore = ({classes, handleLoadMoreClick}: Props) => (
  <div className={classes.container}>
    <Button type="button" variant="contained" color="primary" onClick={handleLoadMoreClick}>
      Load More
    </Button>
  </div>
);

const areAllLinksLoading = ({linksLoading}: Props) => linksLoading;
const hasSearchTerm = ({searchTerm}: Props) => searchTerm?.length > 0;
const isLoading = ({loading}: Props) => loading;

const handleLoadMoreClick = ({setLoading, page, setPage, loadMoreRecentLinks}: Props) => () => {
  setLoading(true);

  loadMoreRecentLinks(PAGE_SIZE, page + 1);
  setPage(page + 1);
};

const onMoreLinksLoaded = ({setLoading}: Props) => {
  setLoading(false);
};

const styles = (theme: Theme) => ({
  container: {
    minHeight: 24,
    width: '100%',
    padding: 12,

    display: 'flex',
    justifyContent: 'center',
  },
  button: {
    color: theme.palette.primary.main,
  },
});

export default compose(
  withState('loading', 'setLoading', false),
  withState('page', 'setPage', 0),

  withSelector('linksLoading', loadingSelector),
  withSelector('links', linksSelector),
  withSelector('searchTerm', searchTermSelector),

  withActions({loadMoreRecentLinks}),

  withCallback('handleLoadMoreClick', handleLoadMoreClick),
  withEffect(onMoreLinksLoaded, ['links']),

  withStyles(styles),

  renderIf(hasSearchTerm, Empty),
  renderIf(areAllLinksLoading, Empty),
  renderIf(isLoading, Loading),
)(LoadMore);
