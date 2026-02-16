/**
 * - Extensión de tipos de Express para incluir `authUser` en `Request`.
 * - Mantiene compatibilidad tipada con middlewares de autenticación.
 */
import type { RoleCode } from '../modules/auth/application/strategies/role.strategy';

export interface AuthenticatedRequestUser {
  id: number;
  email: string;
  role: RoleCode;
  unit: string;
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthenticatedRequestUser;
    }
  }
}

export {};
