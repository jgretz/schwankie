import React, {Component} from 'react';
import {connect} from 'react-redux';

import {loadRecentLinks} from '../actions';

class Search extends Component {
  componentDidMount() {
    this.props.loadRecentLinks();
  }

  render() {
    return <div>Hello World</div>;
  }
}

export default connect(null, {loadRecentLinks})(Search);
