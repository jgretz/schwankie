import React from 'react';
import {connect} from 'react-redux';
import {compose} from 'recompose';
import withLifecycle from '@hocs/with-lifecycle';

import {Auth, Link} from './controls';
import {loadToken} from '../actions';
import {tokenSelector} from '../selectors';

const Admin = ({token}) => <div>{token ? <Link /> : <Auth />}</div>;

// compose
const ComposedAdmin = compose(
  withLifecycle({
    onDidMount({loadToken}) {
      loadToken();
    },
  }),
)(Admin);

// redux
const mapStateToProps = state => ({
  token: tokenSelector(state),
});

export default connect(
  mapStateToProps,
  {loadToken},
)(ComposedAdmin);
