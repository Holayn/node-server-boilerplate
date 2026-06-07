import dotenv from 'dotenv';

dotenv.config({ quiet: true });

if (!process.env.NOTIFY_SERVICE_URL && process.env.NODE_ENV !== 'development') {
  throw new Error('Notify service URL is not defined.');
}

export const NOTIFY_SERVICE_URL = process.env.NOTIFY_SERVICE_URL;
export const NOTIFY_SERVICE_USER = process.env.NOTIFY_SERVICE_USER;
export const PORT = process.env.PORT || 3000;
export const NODE_ENV = process.env.NODE_ENV;

export const isDevelopment = NODE_ENV === 'development';