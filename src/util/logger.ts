import { createLogger, format, transports, Logger as winstonLogger } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { join } from 'node:path';
import { getDirname } from './path.js';
import { notify } from '../services/notify.js';

const { combine, timestamp, json, colorize, printf, align, errors } = format;

const logDir = join(getDirname(import.meta.url), '../../logs');

class Logger {
    _httpLogger: winstonLogger;
    _appLogger: winstonLogger;

    constructor() {
        this._httpLogger = createLogger({
            transports: [
                new transports.Console({
                    format: combine(
                        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                        printf(({ timestamp, message }) => `${timestamp}: ${message}`),
                        colorize(),
                        align(),
                    ),
                }),
                new DailyRotateFile({
                    filename: join(logDir, 'request.log'),
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
                        printf(({ timestamp, level, message, stack, ...meta }) => `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}${stack ? `\n${stack}` : ''}`),
                        colorize(),
                    ),
                }),
                new DailyRotateFile({
                    filename: join(logDir, 'server.log'),
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
    }

    http(message: string, ...meta: any[]) {
        this._httpLogger.http(message, meta);
    }

    info(message: string, ...meta: any[]) {
        this._appLogger.info(message, meta);
    }

    error(src: any, canNotify = true, ...meta: any[]) {
        let message, stack;

        if (src instanceof Error) {
            message = src.message;
            stack = src.stack;
        } else {
            message = src;
        }
        
        this._appLogger.error(message, {
            ...meta,
            stack,
        });

        if (canNotify) {
            (async () => {
                try {
                    await notify(message);
                } catch (e) {
                    this.error(e, false);
                }
            })();
        }
    }
}

export default new Logger();