import React from 'react';
import {Switch, Route} from 'react-router';

import {Main} from '../../main/components';
import {NotFound} from '../../shared/components';

export default () => (
  <Switch>
    <Route exact path="/">
      <Main />
    </Route>

    <Route>
      <NotFound />
    </Route>
  </Switch>
);
