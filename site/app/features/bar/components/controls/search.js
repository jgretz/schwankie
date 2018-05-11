import React from 'react';
import {connect} from 'react-redux';
import {Input, Icon} from 'semantic-ui-react';

import {updateSearch} from '../../actions';
import {searchSelector} from '../../selectors';

const handleSearch = term => () => {
  console.log(term); // eslint-disable-line
};

const searchBox = ({search, updateSearch}) => {
  const icon = (
    <Icon name='search' inverted circular link onClick={handleSearch(search)} /> 
  );

  return (
    <Input icon={icon} placeholder="Search ..." value={search} onChange={updateSearch} />
  );
};

const mapStateToProps = state => ({
  search: searchSelector(state),
});

export default connect(mapStateToProps, {updateSearch})(searchBox);