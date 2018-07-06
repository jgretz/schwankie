import React from 'react';
import {connect} from 'react-redux';
import WorkerImage from 'react-sw-img';

import {updateSearch} from '../../search/actions';
import {DEFAULT_IMAGE} from '../../shared/constants';

const handleTagClick = (tag, {updateSearch}) => () => {
  updateSearch({target: {value: tag}});
};

const renderTags = (tags, props) =>
  tags.map((tag, index) => (
    <div key={index} onClick={handleTagClick(tag, props)}>
      {tag}
      {index === tags.length - 1 ? '' : ', '}
    </div>
  ));

const Item = ({item, imageLoaded, ...props}) => {
  const {url, title, description, image, tags} = item;
  return (
    <li>
      <WorkerImage
        src={image}
        onLoad={imageLoaded}
        placeholder={DEFAULT_IMAGE}
      />

      <div className="footer">
        <a href={url} target="_blank">
          <h3>{title}</h3>
        </a>
        <div>{description}</div>
        <div className="tags">Tags: {renderTags(tags, props)}</div>
      </div>
    </li>
  );
};

export default connect(null, {updateSearch})(Item);
