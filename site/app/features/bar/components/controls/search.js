import React from 'react';
import {connect} from 'react-redux';
import {Input, Icon} from 'semantic-ui-react';

import {updateSearch} from '../../actions';
import {searchForLinks} from '../../../search/actions';
import {searchSelector} from '../../selectors';

const handleKeyPress = (term, searchForLinks) => event => {
  if (event.key !== 'Enter') {
    return;
  }

  searchForLinks(term);
};

const handleSearch = (term, searchForLinks) => () => {
  searchForLinks(term);
};

const searchBox = ({search, updateSearch, searchForLinks}) => {
  const icon = (
    <Icon
      name="search"
      inverted
      circular
      link
      onClick={handleSearch(search, searchForLinks)}
    />
  );

  return (
    <Input
      icon={icon}
      placeholder="Search ..."
      value={search}
      onChange={updateSearch}
      onKeyPress={handleKeyPress(search, searchForLinks)}
    />
  );
};

const mapStateToProps = state => ({
  search: searchSelector(state),
});

export default connect(mapStateToProps, {updateSearch, searchForLinks})(
  searchBox,
);
