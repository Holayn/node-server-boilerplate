import {
  createLogger,
  format,
  transports,
  Logger as winstonLogger,
} from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { join } from 'node:path';
import { getDirname } from './path.js';
import { notify } from '../services/notify.js';

interface ErrorOptions {
  notify?: boolean;
  [key: string]: any;
}

const LOG_DIR = join(getDirname(import.meta.url), '../../../logs');

const { combine, timestamp, json, colorize, printf, errors } = format;

class Logger {
  _httpLogger: winstonLogger;
  _appLogger: winstonLogger;

  constructor() {
    this._httpLogger = createLogger({
      transports: [
        new transports.Console({
          format: combine(
            timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            colorize(),
            printf(({ timestamp, message }) => `${timestamp}: ${message}`),
          ),
        }),
        new DailyRotateFile({
          dirname: LOG_DIR,
          filename: 'request.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          format: combine(timestamp(), json()),
        }),
      ],
      exitOnError: false,
    });

    this._appLogger = createLogger({
      transports: [
        new transports.Console({
          format: combine(
            timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            errors({ stack: true }),
            colorize(),
            printf(
              ({ timestamp, level, message, stack, ...meta }) =>
                `${timestamp} ${level}: ${message}${Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : ''}${stack ? `\n${String(stack)}` : ''}`,
            ),
          ),
        }),
        new DailyRotateFile({
          dirname: LOG_DIR,
          filename: 'server.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          format: combine(timestamp(), errors({ stack: true }), json()),
        }),
        new DailyRotateFile({
          level: 'error',
          dirname: LOG_DIR,
          filename: 'error.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          format: combine(
            timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            errors({ stack: true }),
            printf(
              ({ timestamp, message, stack, ...meta }) =>
                `${timestamp}: ${message}${Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : ''}${stack ? `\n${String(stack)}` : ''}`,
            ),
          ),
        }),
      ],
      exitOnError: false,
    });
  }

  http(message: string, ...meta: any) {
    this._httpLogger.info(message, meta);
  }

  info(message: string, ...meta: any) {
    this._appLogger.info(message, meta);
  }

  error(message: string, error?: Error, options?: ErrorOptions): void;
  error(error: Error, options?: ErrorOptions): void;
  error(
    messageOrError: string | Error,
    errorOrOptions?: Error | ErrorOptions,
    options?: ErrorOptions,
  ): void {
    let message: string;
    let errorObj: Error | undefined;
    let finalOptions: ErrorOptions = {};

    // Handle different overloads
    if (typeof messageOrError === 'string') {
      message = messageOrError;
      errorObj = errorOrOptions as Error;
      finalOptions = options || {};
    } else {
      message = messageOrError.message;
      errorObj = messageOrError;
      finalOptions = (errorOrOptions as ErrorOptions) || {};
    }

    this._appLogger.error(message, { ...finalOptions, stack: errorObj?.stack });

    const { notify: shouldNotify = true } = finalOptions;

    if (shouldNotify) {
      this.sendNotification(message).catch((err: Error) => {
        this.error(`Failed to send notification: ${err.message}`, err, {
          notify: false,
        });
      });
    }
  }

  private async sendNotification(message: string) {
    await notify(message);
  }
}

export default new Logger();
