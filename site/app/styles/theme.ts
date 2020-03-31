import {createMuiTheme} from '@material-ui/core/styles';

export default createMuiTheme({
  palette: {
    type: 'dark',
    background: {default: '#25272C'},
    primary: {main: '#FF5F1A'},
    secondary: {main: '#3D4044'},
  },
  typography: {
    fontFamily: ['Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'].join(','),
  },
});
