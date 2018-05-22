import cosmosSql from 'cosmos-sql';
import {cosmosConfig} from '../constants';

export default () => app => {
  app.use((req, res, next) => {
    cosmosSql({
      ...cosmosConfig,
      collections: ['links'],
    }).then(cosmos => {
      req.cosmos = cosmos;
      next();
    });
  });
};
