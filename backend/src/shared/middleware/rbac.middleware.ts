/**
 * - Middleware RBAC para autorización por permisos.
 * - Evalúa si el usuario autenticado posee el permiso requerido.
 */
import type { Request, Response, NextFunction } from 'express';
import { authService } from '../../modules/auth/auth.container';
import type { AuthenticatedRequest } from '../types/authenticated-request';

/**
 * Fábrica de middleware que protege una ruta por código de permiso.
 */
export function requirePermission(permissionCode: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.authUser) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    const permissions = await authService.getPermissions(authReq.authUser.id);

    if (!permissions.includes(permissionCode)) {
      res.status(403).json({ message: 'No tienes permisos para esta acción.' });
      return;
    }

    next();
  };
}
