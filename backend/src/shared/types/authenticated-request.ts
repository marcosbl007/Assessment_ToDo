/**
 * - Tipos auxiliares para requests autenticadas.
 * - Define el shape de `authUser` adjuntado por middleware.
 */
import type { Request } from 'express';
import type { RoleCode } from '../../modules/auth/application/strategies/role.strategy';

export interface AuthenticatedRequestUser {
  id: number;
  email: string;
  role: RoleCode;
  unit: string;
}

export interface AuthenticatedRequest extends Request {
  authUser?: AuthenticatedRequestUser;
}
