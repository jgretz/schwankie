import React from 'react';
import {withRouter} from 'react-router';

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

export default withRouter(App);
