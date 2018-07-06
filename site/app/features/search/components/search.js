import React from 'react';
import {connect} from 'react-redux';
import {Input, Icon} from 'semantic-ui-react';
import {compose} from 'recompose';
import withLifecycle from '@hocs/with-lifecycle';

import {
  searchForLinks,
  loadRandomLinks,
  loadRecentLinks,
  updateSearch,
} from '../actions';
import {termSelector, sourceSelector} from '../selectors';
import {SOURCE} from '../../shared/constants';

// actions
const loadLinks = ({source, loadRandomLinks, loadRecentLinks}) => {
  const load = source === SOURCE.Random ? loadRandomLinks : loadRecentLinks;
  load();
};

const handleSearch = (term, {searchForLinks, ...props}) => event => {
  if (event.key && event.key !== 'Enter') {
    return;
  }

  if (term.length === 0) {
    loadLinks(props);
    return;
  }

  searchForLinks(term);
};

// render
const Search = ({term, updateSearch, ...props}) => {
  const handler = handleSearch(term, props);

  const icon = <Icon name="search" inverted circular link onClick={handler} />;

  return (
    <Input
      icon={icon}
      placeholder="Search ..."
      value={term}
      onChange={updateSearch}
      onKeyPress={handler}
    />
  );
};

// lifecycle
const ComposedSearch = compose(
  withLifecycle({
    onDidMount(props) {
      loadLinks(props);
    },
    onDidUpdate(prevProps, props) {
      if (props.source !== prevProps.source) {
        loadLinks(props);
      }
    },
  }),
)(Search);

// redux
const mapStateToProps = state => ({
  term: termSelector(state),
  source: sourceSelector(state),
});

const mapDispatchToProps = {
  updateSearch,
  loadRandomLinks,
  loadRecentLinks,
  searchForLinks,
};

export default connect(mapStateToProps, mapDispatchToProps)(ComposedSearch);
