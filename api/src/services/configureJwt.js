import _ from 'lodash';
import jwt from 'jsonwebtoken';
import {logWarning, GET, POST} from 'node-bits';

import {secret} from '../constants';

const getToken = req => {
  const locations = [
    req.body.token,
    req.query.token,
    req.headers['x-access-token'],
    req.headers.authorization,
    req.headers.Authorization,
  ];

  return _.find(locations, loc => _.isString(loc));
};

const API = '/api';
const SEARCH = '/api/links';
const AUTH = '/api/auth';

const isApi = req => req.url.startsWith(API);
const isSearch = req => req.method === GET && req.url.startsWith(SEARCH);
const isAuth = req => req.method === POST && req.url === AUTH;

export default () => app => {
  app.use((req, res, next) => {
    if (!isApi(req) || isSearch(req) || isAuth(req)) {
      next();
      return;
    }

    const failure = () => {
      res.status(403).send({
        success: false,
        message: 'No valid token provided.',
      });
    };

    const token = getToken(req);
    if (!token) {
      logWarning(`No token specified to access ${req.url}`);
      failure();
      return;
    }

    jwt.verify(token, secret, err => {
      if (err) {
        logWarning(`Token data invalid to access ${req.url}`);
        failure();
        return;
      }

      next();
    });
  });
};
