import {Injectable, NestMiddleware} from '@nestjs/common';
import {Request, Response, NextFunction} from 'express';

@Injectable()
export class ApiKeyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.baseUrl.includes('images/random')) {
      next();
      return;
    }

    if (req.headers.api_key === process.env.API_KEY) {
      next();
      return;
    }

    res.status(403).send();
  }
}
