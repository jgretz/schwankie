import React from 'react';
import {Store} from 'redux';
import {Provider} from 'react-redux';
import {BrowserRouter as Router} from 'react-router-dom';

import {App} from './features/scaffolding/components';

type Props = {
  store: Store;
};

const Root = ({store}: Props) => (
  <Provider store={store}>
    <Router>
      <App />
    </Router>
  </Provider>
);

export default Root;
