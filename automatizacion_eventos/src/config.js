import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 4000;
export const DB_URI = process.env.DB_URI;
export const LOGIN_URL = process.env.LOGIN_URL;
export const LOGIN_ID = process.env.LOGIN_ID;
export const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD;
export const RIO_URL = process.env.RIO_URL;
export const DEVICE_IDS = process.env.DEVICE_IDS?.split(',');
export const CRON_SCHEDULE = process.env.CRON_SCHEDULE;
export const POSTGRES_USER = process.env.POSTGRES_USER;
export const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD;
export const POSTGRES_HOST = process.env.POSTGRES_HOST;
export const POSTGRES_PORT = process.env.POSTGRES_PORT;
export const POSTGRES_DB = process.env.POSTGRES_DB;