import type { Request, Response } from 'express';
import { HttpError } from '../../shared/errors/HttpError';
import type { AuthenticatedRequest } from '../../shared/types/authenticated-request';
import type { LoginRequest, RegisterRequest, SupervisorTokenRequest, UpdatePasswordRequest, UpdateProfileRequest } from './auth.types';
import type { AuthService } from './application/services/auth.service';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

  requestSupervisorToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const payload = req.body as SupervisorTokenRequest;
      const result = await this.authService.requestSupervisorToken(payload);

      res.status(200).json(result);
    } catch (error) {
      this.handleAuthError(error, res);
    }
  };

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

  private handleAuthError(error: unknown, res: Response): void {
    if (error instanceof HttpError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    console.error('Error en auth:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}
