import React, {Component} from 'react';
import {connect} from 'react-redux';
import Masonry from 'react-masonry-component';
import autobind from 'autobind-decorator';
import {Message, Loader} from 'semantic-ui-react';

import {loadRandomLinks, searchForLinks} from '../actions';
import {updateSearch} from '../../bar/actions';
import {linksSelector} from '../selectors';
import {searchSelector} from '../../bar/selectors';

const DEFAULT_IMAGE = 'https://placeimg.com/300/300/any/grayscale';
const getImage = image => (image && image.length > 0 ? image : DEFAULT_IMAGE);

class Search extends Component {
  componentDidMount() {
    this.props.loadRandomLinks();
  }

  // actions
  @autobind
  handleTagClick(tag) {
    return () => {
      this.props.updateSearch({target: {value: tag}});
      this.props.searchForLinks(tag);
    };
  }

  // render
  renderTags(tags) {
    return tags.map((tag, index) => (
      <div key={tag} onClick={this.handleTagClick(tag)}>
        {tag}
        {index === tags.length - 1 ? '' : ', '}
      </div>
    ));
  }

  @autobind
  renderLink({id, url, title, description, image, tags}) {
    return (
      <li key={id}>
        <img src={getImage(image)} />

        <div className="footer">
          <a href={url} target="_blank">
            <h3>{title}</h3>
          </a>
          <div>{description}</div>
          <div className="tags">Tags: {this.renderTags(tags)}</div>
        </div>
      </li>
    );
  }

  @autobind
  renderLinks(links) {
    return (
      <Masonry elementType="ul" className="search-list">
        {links.map(this.renderLink)}
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
    const {links, searchTerm} = this.props;

    if (links.length === 0) {
      if (searchTerm.length === 0) {
        return this.renderLoading();
      } else {
        return this.renderNoneFound(searchTerm);
      }
    }

    return this.renderLinks(links);
  }
}

const mapStateToProps = state => ({
  links: linksSelector(state),
  searchTerm: searchSelector(state),
});

export default connect(mapStateToProps, {
  loadRandomLinks,
  searchForLinks,
  updateSearch,
})(Search);
