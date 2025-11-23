import { Application } from 'express';
import hbs from 'hbs';
import { join } from 'path';
import { getDirname } from '../util/path.js';

export const configureHbs = (app: Application) => {
  app.set('view engine', 'hbs');
  app.set('views', join(getDirname(import.meta.url), '../../../src/views'));
  hbs.registerPartials(
    join(getDirname(import.meta.url), '../../../src/views/partials'),
  );

  hbs.registerHelper('eq', function (this: any, arg1, arg2, options) {
    // eslint-disable-next-line
    return arg1 == arg2 ? options.fn(this) : options.inverse(this);
  });

  hbs.registerHelper('or', function (...args: any[]) {
    return args.some(Boolean);
  });

  hbs.registerHelper('nonce', function (this: any) {
    // eslint-disable-next-line
    return this.nonce;
  });
};
