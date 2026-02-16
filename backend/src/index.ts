/**
 * - Punto de entrada del backend Express.
 * - Configura middlewares globales, healthcheck y módulos de rutas.
 */
import cors from 'cors';
import express, { Request, Response } from 'express';
import { env } from './config/env';
import { pool } from './db/pool';
import { authRouter } from './modules/auth/auth.routes';
import { tasksRouter } from './modules/tasks/tasks.routes';

const app = express();
const PORT = env.port;

app.use(cors());
app.use(express.json());

/** Endpoint raíz informativo del servicio. */
app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'API backend funcionando (Express + PostgreSQL)' });
});

/** Endpoint de salud que valida conectividad básica con la BD. */
app.get('/health', async (_req: Request, res: Response) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', db: 'connected' });
  } catch {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/tasks', tasksRouter);

/** Inicializa el servidor HTTP sobre el puerto configurado. */
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
