import React from 'react';
import {connect} from 'react-redux';
import {Input, Icon} from 'semantic-ui-react';

import {updateSearch} from '../../actions';
import {searchForLinks, loadRecentLinks} from '../../../search/actions';
import {searchSelector} from '../../selectors';

const handleSearch = (term, searchForLinks, loadRecentLinks) => event => {
  if (event.key && event.key !== 'Enter') {
    return;
  }

  if (term.length === 0) {
    loadRecentLinks();
    return;
  }

  searchForLinks(term);
};

const searchBox = ({search, updateSearch, searchForLinks, loadRecentLinks}) => {
  const handler = handleSearch(search, searchForLinks, loadRecentLinks);

  const icon = <Icon name="search" inverted circular link onClick={handler} />;

  return (
    <Input
      icon={icon}
      placeholder="Search ..."
      value={search}
      onChange={updateSearch}
      onKeyPress={handler}
    />
  );
};

const mapStateToProps = state => ({
  search: searchSelector(state),
});

export default connect(mapStateToProps, {
  updateSearch,
  loadRecentLinks,
  searchForLinks,
})(searchBox);
