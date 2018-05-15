import React, {Component} from 'react';
import {connect} from 'react-redux';
import Masonry from 'react-masonry-component';
import autobind from 'autobind-decorator';

import {loadRecentLinks, searchForLinks} from '../actions';
import {updateSearch} from '../../bar/actions';
import {linksSelector} from '../selectors';

const DEFAULT_IMAGE = 'https://placeimg.com/300/300/any/grayscale';
const getImage = image => (image && image.length > 0 ? image : DEFAULT_IMAGE);

class Search extends Component {
  componentDidMount() {
    this.props.loadRecentLinks();
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

  render() {
    const {links} = this.props;

    const linkElements = links.map(
      ({id, url, title, description, image, tags}) => (
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
      ),
    );

    return (
      <Masonry elementType="ul" className="search-list">
        {linkElements}
      </Masonry>
    );
  }
}

const mapStateToProps = state => ({
  links: linksSelector(state),
});

export default connect(mapStateToProps, {
  loadRecentLinks,
  searchForLinks,
  updateSearch,
})(Search);
