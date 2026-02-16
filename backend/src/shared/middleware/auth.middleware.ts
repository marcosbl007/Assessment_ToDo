import type { Request, Response, NextFunction } from 'express';
import { HttpError } from '../errors/HttpError';
import { authService } from '../../modules/auth/auth.container';
import type { AuthenticatedRequest } from '../types/authenticated-request';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as AuthenticatedRequest;

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new HttpError(401, 'Token de acceso requerido.');
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const payload = authService.verifyAccessToken(token);

    authReq.authUser = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      unit: payload.unit,
    };

    next();
  } catch (error) {
    if (error instanceof HttpError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    res.status(401).json({ message: 'No autorizado.' });
  }
}
