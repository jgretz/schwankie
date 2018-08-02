import React from 'react';
import {connect} from 'react-redux';
import {compose} from 'recompose';
import {withRouter} from 'react-router';
import withLifecycle from '@hocs/with-lifecycle';

import {loadToken} from './features/admin/actions';

import {Bar} from './features/bar/components';
import {Routes} from './features/shared/components';
import {Footer} from './features/footer/components';

const App = () => (
  <div className="wrapper">
    <Bar />
    <Routes />
    <Footer />
  </div>
);

// compose
const ComposedApp = compose(
  withLifecycle({
    onDidMount({loadToken}) {
      loadToken();
    },
  }),
)(App);

// redux
const ConnectedApp = connect(
  null,
  {loadToken},
)(ComposedApp);

// router
export default withRouter(ConnectedApp);
