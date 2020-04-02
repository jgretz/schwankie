import React from 'react';
import {Router} from 'react-router';

import {createBrowserHistory} from 'history';

import {MuiThemeProvider} from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import StyledSnackbarProvider from './StyledSnackbarProvider';

import Routes from './Routes';
import theme from '../../../styles/theme';

const history = createBrowserHistory();

const App = () => (
  <Router history={history}>
    <MuiThemeProvider theme={theme}>
      <StyledSnackbarProvider>
        <CssBaseline />

        <Routes />
      </StyledSnackbarProvider>
    </MuiThemeProvider>
  </Router>
);

export default App;
