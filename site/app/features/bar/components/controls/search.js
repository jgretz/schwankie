import React from 'react';
import {connect} from 'react-redux';
import {Input, Icon} from 'semantic-ui-react';

import {updateSearch} from '../../actions';
import {searchForLinks, loadRandomLinks} from '../../../search/actions';
import {searchSelector} from '../../selectors';

const handleSearch = (term, searchForLinks, loadRandomLinks) => event => {
  if (event.key && event.key !== 'Enter') {
    return;
  }

  if (term.length === 0) {
    loadRandomLinks();
    return;
  }

  searchForLinks(term);
};

const searchBox = ({search, updateSearch, searchForLinks, loadRandomLinks}) => {
  const handler = handleSearch(search, searchForLinks, loadRandomLinks);

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
  loadRandomLinks,
  searchForLinks,
})(searchBox);
