import React from 'react';
import {connect} from 'react-redux';

import {Auth, Link} from './controls';
import {tokenSelector} from '../selectors';

const admin = ({token}) => (
  <div>
    {token ? <Link /> : <Auth />}
  </div>
);

const mapStateToProps = state => ({
  token: tokenSelector(state),
});

export default connect(mapStateToProps)(admin);