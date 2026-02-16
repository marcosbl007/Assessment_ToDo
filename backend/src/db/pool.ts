/**
 * - Configuración central del pool de conexiones PostgreSQL.
 * - Reutilizado por repositorios para ejecutar consultas.
 */
import { Pool } from 'pg';
import { env } from '../config/env';

/** Instancia compartida del pool con límites de conexión y tiempos de espera. */
export const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.database,
  user: env.db.user,
  password: env.db.password,
  max: 15,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

/** Manejo de errores inesperados emitidos por el pool. */
pool.on('error', (error) => {
  console.error('Error inesperado en el pool de PostgreSQL:', error);
});
