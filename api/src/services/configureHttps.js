import {httpsConfig} from '../constants';

export default () => app => {
  app.get(httpsConfig.url, (req, res) => {
    res.status(200).send(httpsConfig.data);
  });
};
