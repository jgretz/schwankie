import {join} from 'path';

export default (file = '') => {
  if (process.env.NODE_ENV === 'PRODUCTION') {
    return join(__dirname, '../site', file);
  }

  return join(__dirname, '../../../lib/site', file);
};
