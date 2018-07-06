import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Input, Icon} from 'semantic-ui-react';
import autobind from 'autobind-decorator';

import {
  searchForLinks,
  loadRandomLinks,
  loadRecentLinks,
  updateSearch,
} from '../actions';
import {termSelector, sourceSelector} from '../selectors';
import {SOURCE} from '../../shared/constants';

class Search extends Component {
  componentDidMount() {
    this.loadLinks();
  }

  componentDidUpdate(prevProps) {
    if (this.props.source !== prevProps.source) {
      this.loadLinks();
    }
  }

  @autobind
  loadLinks() {
    const {source, loadRandomLinks, loadRecentLinks} = this.props;
    const load = source === SOURCE.Random ? loadRandomLinks : loadRecentLinks;

    load();
  }

  handleSearch(term, searchForLinks, loadRandomLinks) {
    return event => {
      if (event.key && event.key !== 'Enter') {
        return;
      }

      if (term.length === 0) {
        loadRandomLinks();
        return;
      }

      searchForLinks(term);
    };
  }

  render() {
    const {term, updateSearch, searchForLinks, loadRandomLinks} = this.props;
    const handler = this.handleSearch(term, searchForLinks, loadRandomLinks);

    const icon = (
      <Icon name="search" inverted circular link onClick={handler} />
    );

    return (
      <Input
        icon={icon}
        placeholder="Search ..."
        value={term}
        onChange={updateSearch}
        onKeyPress={handler}
      />
    );
  }
}

const mapStateToProps = state => ({
  term: termSelector(state),
  source: sourceSelector(state),
});

export default connect(mapStateToProps, {
  updateSearch,
  loadRandomLinks,
  loadRecentLinks,
  searchForLinks,
})(Search);
