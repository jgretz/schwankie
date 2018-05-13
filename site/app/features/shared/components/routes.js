import React from 'react';
import {Switch, Route} from 'react-router';

import {Admin} from '../../admin/components';
import NotFound from './notFound';

import {ROUTES} from '../constants';

export default () => (
  <Switch>
    <Route path={ROUTES.admin.route} component={Admin} />
    <Route component={NotFound} />
  </Switch>
);
