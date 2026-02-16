/**
 * - Rutas HTTP del módulo de autenticación.
 * - Incluye registro, login, perfil y verificación de permisos.
 */
import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authService } from './auth.container';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { requirePermission } from '../../shared/middleware/rbac.middleware';

export const authRouter = Router();
const authController = new AuthController(authService);

authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
authRouter.post('/supervisor-token/request', authController.requestSupervisorToken);
authRouter.get('/me', authenticate, authController.me);
authRouter.put('/me/profile', authenticate, authController.updateProfile);
authRouter.put('/me/password', authenticate, authController.updatePassword);
/** Ruta de verificación rápida para UI sobre permiso de aprobación. */
authRouter.get('/can-approve', authenticate, requirePermission('TASK_APPROVE_CHANGES'), (_req, res) => {
	res.status(200).json({ message: 'Permiso de aprobación confirmado' });
});
