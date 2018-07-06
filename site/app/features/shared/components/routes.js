import React from 'react';
import {Switch, Route} from 'react-router';

import {About} from '../../about/components';
import {Admin} from '../../admin/components';
import {Grid} from '../../grid/components';
import NotFound from './notFound';

import {ROUTES} from '../constants';

export default () => (
  <Switch>
    <Route exact path={ROUTES.home.route} component={Grid} />
    <Route path={ROUTES.admin.route} component={Admin} />
    <Route path={ROUTES.about.route} component={About} />
    <Route component={NotFound} />
  </Switch>
);
