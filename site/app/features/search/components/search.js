import React, {Component} from 'react';
import {connect} from 'react-redux';
import Masonry from 'react-masonry-component';

import {loadRecentLinks} from '../actions';
import {linksSelector} from '../selectors';

const DEFAULT_IMAGE = 'https://placeimg.com/300/300/any/grayscale';
const getImage = image => (image && image.length > 0 ? image : DEFAULT_IMAGE);

class Search extends Component {
  componentDidMount() {
    this.props.loadRecentLinks();
  }

  // render
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
            <p>{description}</p>
            <p className="tags">Tags: {tags.join(', ')}</p>
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

export default connect(mapStateToProps, {loadRecentLinks})(Search);
