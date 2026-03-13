import pg from 'pg';
import { POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB } from "./config.js";

const { Pool } = pg;

// Configuración por partes
const pool = new Pool({
  user: POSTGRES_USER,
  host: POSTGRES_HOST,
  database: POSTGRES_DB,
  password: POSTGRES_PASSWORD,
  port: POSTGRES_PORT || 5432,

  // Configuración del pool de conexiones
  max: 20, // Máximo de conexiones simultáneas
  idleTimeoutMillis: 30000, // Tiempo antes de cerrar una conexión inactiva
  connectionTimeoutMillis: 2000, // Tiempo máximo para establecer conexión

  // SSL para conexiones en la nube
  // ssl: {
  //   rejectUnauthorized: false
  // }
});

export default pool;