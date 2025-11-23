import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';

export const nonceGenerator = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.locals.nonce = randomBytes(16).toString('base64');
  next();
};

export const cspDirectives = {
  defaultSrc: ["'self'"],
  imgSrc: ['*'],
  objectSrc: ["'none'"],
  scriptSrc: ["'self'"],
  styleSrc: ["'self'"],
};
