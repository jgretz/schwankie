import _ from 'lodash';
import React from 'react';
import {connect} from 'react-redux';
import Masonry from 'react-masonry-component';
import {Message, Loader} from 'semantic-ui-react';
import {compose, withHandlers} from 'recompose';
import withLifecycle from '@hocs/with-lifecycle';

import Source from './source';
import Item from './item';

import {linksSelector} from '../../search/selectors';

// render
const renderLoading = () => (
  <Loader indeterminate active>
    Loading articles
  </Loader>
);

const renderEmpty = () => (
  <Message className="search-message">
    Unable to find any thing related to the current search :(
  </Message>
);

const renderLinks = (links, {onMasonryRef, imageLoaded}) => {
  const linkElements = links.map(link => (
    <Item key={link.id} item={link} imageLoaded={imageLoaded} />
  ));

  return (
    <Masonry elementType="ul" className="search-list" ref={onMasonryRef}>
      {linkElements}
    </Masonry>
  );
};

const Grid = ({links: {loading, items}, ...props}) => {
  if (loading) {
    return renderLoading();
  }

  if (items.length === 0) {
    return renderEmpty();
  }

  return (
    <div className="links-grid">
      <Source />

      {renderLinks(items, props)}
    </div>
  );
};

// compose
const ComposedGrid = compose(
  withHandlers(() => {
    let masonry = null;
    let mounted = true;

    const performLayout = _.debounce(() => {
      if (!mounted || !masonry) {
        return;
      }

      masonry.performLayout();
    }, 500);

    return {
      onMasonryRef: () => x => {
        masonry = x;
      },
      imageLoaded: () => () => {
        performLayout();
      },

      unmount: () => () => {
        mounted = false;
      },
    };
  }),
  withLifecycle({
    onWillUnmount({unmount}) {
      unmount();
    },
  }),
)(Grid);

// redux
const mapStateToProps = state => ({
  links: linksSelector(state),
});

export default connect(mapStateToProps)(ComposedGrid);
