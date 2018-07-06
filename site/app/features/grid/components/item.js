import React from 'react';
import {connect} from 'react-redux';
import WorkerImage from 'react-sw-img';
import {Icon} from 'semantic-ui-react';
import {withRouter} from 'react-router-dom';

import {updateSearch} from '../../search/actions';
import {updateLinkForm, findLink} from '../../admin/actions';
import {tokenSelector} from '../../admin/selectors';
import {DEFAULT_IMAGE, ROUTES} from '../../shared/constants';

// actions
const handleTagClick = (tag, {updateSearch}) => () => {
  updateSearch({target: {value: tag}});
};

const handleAdminClick = (item, {history, updateLinkForm, findLink}) => () => {
  updateLinkForm('url', item.url);
  findLink(item.url);

  history.push(ROUTES.admin.route);
};

// render
const renderTags = (tags, props) =>
  tags.map((tag, index) => (
    <div key={index} onClick={handleTagClick(tag, props)}>
      {tag}
      {index === tags.length - 1 ? '' : ','}
    </div>
  ));

const renderAdmin = (item, {token, ...props}) => {
  if (!token) {
    return <div />;
  }

  return (
    <div className="admin-edit" onClick={handleAdminClick(item, props)}>
      <Icon name="arrow circle up" />
      <span>Admin</span>
    </div>
  );
};

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
        <div className="bottom">
          {renderAdmin(item, props)}
          <div className="tags">
            <span className="bold">Tags: </span>
            {renderTags(tags, props)}
          </div>
        </div>
      </div>
    </li>
  );
};

// redux
const mapStateToProps = state => ({
  token: tokenSelector(state),
});

const mapDispatchToProps = {
  updateSearch,
  updateLinkForm,
  findLink,
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Item));
