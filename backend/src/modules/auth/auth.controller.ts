/**
 * - Controlador HTTP del módulo auth.
 * - Orquesta entrada/salida y manejo de errores hacia `AuthService`.
 */
import type { Request, Response } from 'express';
import { HttpError } from '../../shared/errors/HttpError';
import type { AuthenticatedRequest } from '../../shared/types/authenticated-request';
import type { LoginRequest, RegisterRequest, SupervisorTokenRequest, UpdatePasswordRequest, UpdateProfileRequest } from './auth.types';
import type { AuthService } from './application/services/auth.service';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Registra un nuevo usuario y retorna token de sesión inicial. */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const payload = req.body as RegisterRequest;
      const result = await this.authService.register(payload);

      res.status(201).json({
        message: 'Usuario registrado correctamente',
        ...result,
      });
    } catch (error) {
      this.handleAuthError(error, res);
    }
  };

  /** Autentica usuario por identifier y password. */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const payload = req.body as LoginRequest;
      const result = await this.authService.login(payload);

      res.status(200).json({
        message: 'Login exitoso',
        ...result,
      });
    } catch (error) {
      this.handleAuthError(error, res);
    }
  };

  /** Genera y envía token temporal para alta de supervisor. */
  requestSupervisorToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const payload = req.body as SupervisorTokenRequest;
      const result = await this.authService.requestSupervisorToken(payload);

      res.status(200).json(result);
    } catch (error) {
      this.handleAuthError(error, res);
    }
  };

  /** Devuelve perfil y permisos del usuario autenticado. */
  me = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.authUser) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    const [user, permissions] = await Promise.all([
      this.authService.getUserById(authReq.authUser.id),
      this.authService.getPermissions(authReq.authUser.id),
    ]);

    res.status(200).json({
      user,
      permissions,
    });
  };

  /** Actualiza datos de perfil del usuario autenticado. */
  updateProfile = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.authUser) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    try {
      const payload = req.body as UpdateProfileRequest;
      const user = await this.authService.updateProfile(authReq.authUser.id, payload);

      res.status(200).json({
        message: 'Perfil actualizado correctamente.',
        user,
      });
    } catch (error) {
      this.handleAuthError(error, res);
    }
  };

  /** Actualiza contraseña del usuario autenticado. */
  updatePassword = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.authUser) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    try {
      const payload = req.body as UpdatePasswordRequest;
      await this.authService.updatePassword(authReq.authUser.id, payload);

      res.status(200).json({
        message: 'Contraseña actualizada correctamente.',
      });
    } catch (error) {
      this.handleAuthError(error, res);
    }
  };

  /** Traduce errores de dominio y fallos inesperados a respuesta HTTP. */
  private handleAuthError(error: unknown, res: Response): void {
    if (error instanceof HttpError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    console.error('Error en auth:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}
