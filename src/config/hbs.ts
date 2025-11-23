import { Application } from 'express';
import hbs from 'hbs';
import { join } from 'path';
import { getDirname } from '../util/path.js';

export const configureHbs = (app: Application, nonce: string) => {
    app.set('view engine', 'hbs');
    app.set('views', join(getDirname(import.meta.url), '../../../src/views'));
    hbs.registerPartials(join(getDirname(import.meta.url), '../../../src/views/partials'));

    hbs.registerHelper('eq', function (this: any, arg1, arg2, options) {
        return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });

    hbs.registerHelper('or', function() {
        const args = Array.prototype.slice.call(arguments, 0, -1);
        return args.some(Boolean);
    });

    hbs.registerHelper('nonce', function() {
        return nonce;
    });
};
