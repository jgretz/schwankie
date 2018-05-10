import './styles/styles.scss';
import './babelHelpers';

import React from 'react';
import {render} from 'react-dom';
import createHistory from 'history/createBrowserHistory';

import Root from './Root';
import {configureStore, configureHttp, configureToastr} from './util';

// configure stuff
const history = createHistory();
const store = configureStore(history);

configureHttp(store);
configureToastr();

// load it into the page
render(<Root store={store} history={history} />, document.getElementById('app'));