import express, { Application, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';

import logger from './src/util/logger.js';
import routes from './src/routes/index.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(
  morgan('combined', {
    stream: {
      write: (message) => {
        logger.http(message.trim());
      },
    },
  }),
);

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
