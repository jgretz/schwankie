import React from 'react';
import {Switch, Route} from 'react-router';

import {Search} from '../../dashboard/components';
import NotFound from './notFound';

export default () => (
  <Switch>
    <Route exact path="/" component={Search} />

    <Route component={NotFound} />
  </Switch>
);
