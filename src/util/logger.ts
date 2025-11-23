import { createLogger, format, transports, Logger as winstonLogger } from 'winston';
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
          format: combine(
            timestamp(),
            json(),
          ),
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
            printf(({ timestamp, level, message, stack, ...meta }) => `${timestamp} ${level}: ${message}${Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : ''}${stack ? `\n${stack}` : ''}`),
          ),
        }),
        new DailyRotateFile({
          dirname: LOG_DIR,
          filename: 'server.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          format: combine(
            timestamp(),
            errors({ stack: true }),
            json(),
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

  error(src: Error | string, options: ErrorOptions = {}) {
    const { notify: shouldNotify = true, ...meta } = options;

    let message: string;
    let errorObj: Error | undefined;

    if (src instanceof Error) {
      message = src.message;
      errorObj = src;
    } else {
      message = src;
    }

    this._appLogger.error(message, { ...meta, stack: errorObj?.stack });

    if (shouldNotify) {
      this.sendNotification(message).catch((err) => {
        this.error(`Failed to send notification: ${err.message}`, { notify: false });
      });
    }
  }

  private async sendNotification(message: string) {
    try {
      await notify(message);
    } catch (error) {
      throw error;
    }
  }
}

export default new Logger();