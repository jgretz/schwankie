import React from 'react';
import {withRouter} from 'react-router';

import {Bar} from './features/bar/components';
import {Routes} from './features/shared/components';

const App = () => (
  <div>
    <Bar />
    <Routes />
  </div>
);

export default withRouter(App);
