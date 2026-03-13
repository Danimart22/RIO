import { config } from "dotenv";
config();

// MongoDB
export const MONGODB_URI = process.env.MONGODB_URI;
//PostgreSQL
export const POSTGRES_USER = process.env.POSTGRES_USER || "postgres";
export const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD;
export const POSTGRES_HOST = process.env.POSTGRES_HOST || "localhost";
export const POSTGRES_PORT = process.env.POSTGRES_PORT || 5432;
export const POSTGRES_DB = process.env.POSTGRES_DB || "tu_database";
export const POSTGRES_URI = process.env.POSTGRES_URI;

export const PORT = process.env.PORT || 4000;

export const SECRET = process.env.JWT_SECRET;
export const SES_KEY = process.env.SES_KEY;
export const SES_SECRETEKEY = process.env.SES_SECRETEKEY;