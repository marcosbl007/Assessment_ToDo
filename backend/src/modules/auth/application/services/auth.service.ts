import bcrypt from 'bcryptjs';
import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import { env } from '../../../../config/env';
import { HttpError } from '../../../../shared/errors/HttpError';
import type { MailService } from '../../../../shared/services/mail.service';
import type { AuthRepository } from '../ports/AuthRepository';
import { AuthFlowContext } from '../state/auth-flow.state';
import { RoleNormalizationContext, type RoleCode } from '../strategies/role.strategy';
import type { AuthUser, LoginRequest, RegisterRequest, SupervisorTokenRequest, SupervisorTokenResponse } from '../../auth.types';

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

interface AccessTokenPayload {
  sub: number;
  email: string;
  role: RoleCode;
  unit: string;
}

interface SupervisorInvitePayload {
  purpose: 'SUPERVISOR_REGISTER';
  email: string;
  organizationalUnit: string;
  role: 'SUPERVISOR';
}

export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly roleStrategyContext: RoleNormalizationContext,
    private readonly mailService: MailService,
  ) {}

  private signAuthToken(user: AuthUser): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      unit: user.organizationalUnit,
    };

    const secret = env.jwt.secret as Secret;
    const options: SignOptions = {
      expiresIn: env.jwt.expiresIn as SignOptions['expiresIn'],
    };

    return jwt.sign(payload, secret, options);
  }

  private ensurePasswordStrength(password: string): void {
    if (password.length < 8) {
      throw new HttpError(400, 'La contraseña debe tener al menos 8 caracteres.');
    }
  }

  private validateSupervisorRegistrationToken(token: string, email: string, organizationalUnit: string): void {
    let decoded: unknown;

    try {
      decoded = jwt.verify(token, env.jwt.secret);
    } catch {
      throw new HttpError(401, 'Token de supervisor inválido o expirado.');
    }

    if (!decoded || typeof decoded !== 'object' || typeof decoded === 'string') {
      throw new HttpError(401, 'Token de supervisor inválido o expirado.');
    }

    const payload = decoded as Partial<SupervisorInvitePayload>;
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUnit = organizationalUnit.trim().toLowerCase();

    if (
      payload.purpose !== 'SUPERVISOR_REGISTER' ||
      payload.role !== 'SUPERVISOR' ||
      typeof payload.email !== 'string' ||
      typeof payload.organizationalUnit !== 'string' ||
      payload.email.trim().toLowerCase() !== normalizedEmail ||
      payload.organizationalUnit.trim().toLowerCase() !== normalizedUnit
    ) {
      throw new HttpError(403, 'El token de supervisor no coincide con el correo o la unidad seleccionada.');
    }
  }

  async requestSupervisorToken(payload: SupervisorTokenRequest): Promise<SupervisorTokenResponse> {
    if (!payload.name?.trim() || !payload.email?.trim() || !payload.organizationalUnit?.trim()) {
      throw new HttpError(400, 'name, email y organizationalUnit son obligatorios para solicitar token de supervisor.');
    }

    const normalizedEmail = payload.email.trim().toLowerCase();
    const normalizedUnit = payload.organizationalUnit.trim();

    const tokenPayload: SupervisorInvitePayload = {
      purpose: 'SUPERVISOR_REGISTER',
      email: normalizedEmail,
      organizationalUnit: normalizedUnit,
      role: 'SUPERVISOR',
    };

    const inviteToken = jwt.sign(tokenPayload, env.jwt.secret as Secret, {
      expiresIn: env.jwt.supervisorInviteExpiresIn as SignOptions['expiresIn'],
    });

    const mailResult = await this.mailService.sendSupervisorInviteEmail({
      to: normalizedEmail,
      fullName: payload.name.trim(),
      organizationalUnit: normalizedUnit,
      token: inviteToken,
      expiresInLabel: env.jwt.supervisorInviteExpiresIn,
    });

    console.info(
      `[AUTH] Token supervisor enviado | provider=${mailResult.provider} | email=${normalizedEmail} | unit=${normalizedUnit}`,
    );

    return {
      message: 'Visita la URL para consultar el token de supervisor.',
      delivery: 'ethereal',
      previewUrl: mailResult.previewUrl,
    };
  }

  verifyAccessToken(token: string): { sub: number; email: string; role: RoleCode; unit: string } {
    try {
      const decoded = jwt.verify(token, env.jwt.secret);

      if (typeof decoded === 'string' || !decoded || typeof decoded !== 'object') {
        throw new HttpError(401, 'Token inválido o expirado.');
      }

      const payload = decoded as Partial<AccessTokenPayload>;

      if (
        typeof payload.sub !== 'number' ||
        typeof payload.email !== 'string' ||
        (payload.role !== 'STANDARD' && payload.role !== 'SUPERVISOR') ||
        typeof payload.unit !== 'string'
      ) {
        throw new HttpError(401, 'Token inválido o expirado.');
      }

      return {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        unit: payload.unit,
      };
    } catch {
      throw new HttpError(401, 'Token inválido o expirado.');
    }
  }

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    const flow = new AuthFlowContext();

    try {
      flow.start();

      if (!payload.name?.trim() || !payload.email?.trim() || !payload.password?.trim()) {
        throw new HttpError(400, 'name, email y password son obligatorios.');
      }

      if (!payload.organizationalUnit?.trim() || !payload.role?.trim()) {
        throw new HttpError(400, 'organizationalUnit y role son obligatorios.');
      }

      this.ensurePasswordStrength(payload.password);

      const roleCode = this.roleStrategyContext.normalize(payload.role);
      flow.validate();

      const existing = await this.authRepository.findUserByEmail(payload.email);
      if (existing) {
        throw new HttpError(409, 'El correo ya está registrado.');
      }

      const refData = await this.authRepository.findUnitAndRoleIds(payload.organizationalUnit, roleCode);
      if (!refData) {
        throw new HttpError(400, 'Unidad organizacional o rol no válidos para el sistema.');
      }

      if (roleCode === 'SUPERVISOR') {
        if (!payload.supervisorToken?.trim()) {
          throw new HttpError(400, 'Para registrar un supervisor debes ingresar un token de autorización.');
        }

        this.validateSupervisorRegistrationToken(payload.supervisorToken, payload.email, payload.organizationalUnit);
      }

      const passwordHash = await bcrypt.hash(payload.password, 12);
      const user = await this.authRepository.createUser(payload, passwordHash, refData.unitId, refData.roleId);
      const token = this.signAuthToken(user);

      flow.persist();
      flow.complete();

      return { token, user };
    } catch (error) {
      flow.fail();
      throw error;
    }
  }

  async login(payload: LoginRequest): Promise<AuthResponse> {
    const flow = new AuthFlowContext();

    try {
      flow.start();

      const identifier = payload.identifier ?? payload.username ?? payload.email;
      if (!identifier?.trim() || !payload.password?.trim()) {
        throw new HttpError(400, 'identifier y password son obligatorios.');
      }

      flow.validate();

      const dbUser = await this.authRepository.findUserByIdentifier(identifier);
      if (!dbUser) {
        throw new HttpError(401, 'Credenciales inválidas.');
      }

      const isValid = await bcrypt.compare(payload.password, dbUser.passwordHash);
      if (!isValid) {
        throw new HttpError(401, 'Credenciales inválidas.');
      }

      const { passwordHash, ...user } = dbUser;
      const token = this.signAuthToken(user);

      flow.persist();
      flow.complete();

      return { token, user };
    } catch (error) {
      flow.fail();
      throw error;
    }
  }

  async getPermissions(userId: number): Promise<string[]> {
    return this.authRepository.findPermissionsByUserId(userId);
  }
}
