import _ from 'lodash';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import Masonry from 'react-masonry-component';
import autobind from 'autobind-decorator';
import {Message, Loader} from 'semantic-ui-react';

import Source from './source';
import Item from './item';

import {linksSelector} from '../../search/selectors';

class Search extends Component {
  constructor(props) {
    super(props);

    this.imageLoaded = _.debounce(this.imageLoadedLogic, 500);
  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  // actions
  @autobind
  imageLoadedLogic() {
    if (this.masonry && !this.unmounted) {
      this.masonry.performLayout();
    }
  }

  // render
  @autobind
  renderLinks(links) {
    return (
      <Masonry
        elementType="ul"
        className="search-list"
        ref={x => {
          this.masonry = x;
        }}
      >
        {links.map(link => (
          <Item key={link.id} item={link} imageLoaded={this.imageLoadedLogic} />
        ))}
      </Masonry>
    );
  }

  renderNoneFound(searchTerm) {
    return (
      <Message className="search-message">
        Sorry, I don&#39;t have any links that involve the term &#39;{
          searchTerm
        }&#39;
      </Message>
    );
  }

  renderLoading() {
    return <Loader indeterminate>Loading most recent articles</Loader>;
  }

  render() {
    const {links} = this.props;

    if (links.length === 0) {
      return this.renderLoading();
    }

    return (
      <div>
        <Source />
        {this.renderLinks(links)}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  links: linksSelector(state),
});

export default connect(mapStateToProps)(Search);
