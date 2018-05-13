import jwt from 'jsonwebtoken';
import {authConfig, secret} from '../../constants';

export class Auth {
  post(req, res) {
    if (req.body.user !== authConfig.user || req.body.password !== authConfig.password) {
      res.status(403).send('Supplied credentials are invalid');
      return;
    }

    const token = jwt.sign({}, secret, {expiresIn: '4w'});
    res.json({token});
  }
}
