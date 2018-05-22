import compression from 'compression';
import {isDev} from '../services';

export default () => app => {
  if (isDev()) {
    return;
  }

  app.use(compression());
};
