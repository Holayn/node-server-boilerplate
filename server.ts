import express, { Application, Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import cron from 'node-cron';
import { join } from 'path';

import { getDirname } from './src/util/path.js';
import logger from './src/util/logger.js';
import routes from './src/routes/index.js';
import { configureHbs } from './src/config/hbs.js';
import { PORT } from './src/config/env.js';
import { nonceGenerator, cspDirectives } from './src/middleware/security.js';

const app: Application = express();

app.use(nonceGenerator);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...cspDirectives,
        scriptSrc: [
          ...cspDirectives.scriptSrc,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          (req, res) => `'nonce-${(res as any).locals.nonce}'`,
        ],
        styleSrc: [
          ...cspDirectives.styleSrc,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          (req, res) => `'nonce-${(res as any).locals.nonce}'`,
        ],
      },
    },
  }),
);
app.use(cookieParser());
app.use(
  morgan('combined', {
    stream: {
      write: (message) => {
        logger.http(message.trim());
      },
    },
  }),
);
app.use(
  express.static(join(getDirname(import.meta.url), '../public'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js')) {
        res.setHeader('Cache-Control', 'no-cache, must-revalidate');
      }
    },
  }),
);
app.use((req, res, next) => {
  // Only apply cache control headers to HTML responses
  if (req.accepts('html')) {
    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate',
    );
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

configureHbs(app);

app.use('/', routes);
app.get('/health', (req: Request, res: Response) => {
  res.sendStatus(200);
});

// --- Global Error Handler (Must be the last middleware) ---
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(err);
  res.status(500).send('Internal Server Error');
});

process.on('unhandledRejection', (reason: Error) => {
  logger.error(reason);
});

// --- Server Startup ---
const server = app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

cron.schedule('0 0 * * *', () => {
  logger.info('CRON START');
  logger.info('CRON END');
});

const gracefulShutdown = (signal: string) => {
  process.on(signal, () => {
    logger.info(`${signal} signal received: closing server.`);
    server.close(() => {
      logger.info('Server closed.');
      process.exit(0);
    });
  });
};

gracefulShutdown('SIGTERM');
gracefulShutdown('SIGINT');
