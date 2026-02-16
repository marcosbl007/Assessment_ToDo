/**
 * - Servicio de autenticación y gestión de perfil/contraseña.
 * - Orquesta login, registro, emisión y verificación de tokens JWT.
 */
import bcrypt from 'bcryptjs';
import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import { env } from '../../../../config/env';
import { HttpError } from '../../../../shared/errors/HttpError';
import type { MailService } from '../../../../shared/services/mail.service';
import type { AuthRepository } from '../ports/AuthRepository';
import { AuthFlowContext } from '../state/auth-flow.state';
import { RoleNormalizationContext, type RoleCode } from '../strategies/role.strategy';
import type {
  AuthUser,
  LoginRequest,
  RegisterRequest,
  SupervisorTokenRequest,
  SupervisorTokenResponse,
  UpdatePasswordRequest,
  UpdateProfileRequest,
} from '../../auth.types';

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

interface AccessTokenPayload {
  sub: number | string;
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

  /** Firma JWT de sesión con claims mínimos de usuario. */
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

  /** Regla mínima de fortaleza de contraseña. */
  private ensurePasswordStrength(password: string): void {
    if (password.length < 8) {
      throw new HttpError(400, 'La contraseña debe tener al menos 8 caracteres.');
    }
  }

  /** Verifica que el token supervisor sea válido y coherente con email/unidad. */
  private validateSupervisorRegistrationToken(token: string, email: string, organizationalUnit: string): void {
    let decoded: unknown;

    /** Verifica firma y expiración del token firmado por backend. */
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

    /** Exige coincidencia exacta de propósito, rol, correo y unidad esperados. */
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

  /** Emite token temporal de supervisor y envía correo de autorización. */
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

  /** Valida y decodifica token de acceso para middlewares de auth. */
  verifyAccessToken(token: string): { sub: number; email: string; role: RoleCode; unit: string } {
    try {
      const decoded = jwt.verify(token, env.jwt.secret);

      if (typeof decoded === 'string' || !decoded || typeof decoded !== 'object') {
        throw new HttpError(401, 'Token inválido o expirado.');
      }

      const payload = decoded as Partial<AccessTokenPayload>;
      /** Acepta sub numérico o string numérico para compatibilidad histórica. */
      const normalizedSub =
        typeof payload.sub === 'number'
          ? payload.sub
          : typeof payload.sub === 'string' && /^\d+$/.test(payload.sub)
            ? Number(payload.sub)
            : NaN;

      /** Valida claims obligatorios y dominio de rol antes de exponer el payload. */
      if (
        !Number.isInteger(normalizedSub) ||
        normalizedSub <= 0 ||
        typeof payload.email !== 'string' ||
        (payload.role !== 'STANDARD' && payload.role !== 'SUPERVISOR') ||
        typeof payload.unit !== 'string'
      ) {
        throw new HttpError(401, 'Token inválido o expirado.');
      }

      return {
        sub: normalizedSub,
        email: payload.email,
        role: payload.role,
        unit: payload.unit,
      };
    } catch {
      throw new HttpError(401, 'Token inválido o expirado.');
    }
  }

  /** Registra usuario aplicando validaciones de negocio y flujo de estado. */
  async register(payload: RegisterRequest): Promise<AuthResponse> {
    const flow = new AuthFlowContext();

    try {
      flow.start();

      /** Validaciones de campos requeridos y política mínima de contraseña. */
      if (!payload.name?.trim() || !payload.email?.trim() || !payload.password?.trim()) {
        throw new HttpError(400, 'name, email y password son obligatorios.');
      }

      if (!payload.organizationalUnit?.trim() || !payload.role?.trim()) {
        throw new HttpError(400, 'organizationalUnit y role son obligatorios.');
      }

      this.ensurePasswordStrength(payload.password);

      /** Normaliza rol de entrada para alinear variaciones del frontend. */
      const roleCode = this.roleStrategyContext.normalize(payload.role);
      flow.validate();

      /** Evita duplicidad de cuenta por correo antes de crear el registro. */
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

        /** Refuerza que el token pertenezca al mismo correo y unidad solicitados. */
        this.validateSupervisorRegistrationToken(payload.supervisorToken, payload.email, payload.organizationalUnit);
      }

      /** Persiste credenciales de forma segura y retorna token de sesión. */
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

  /** Autentica credenciales y retorna token con perfil público. */
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const flow = new AuthFlowContext();

    try {
      flow.start();

      /** Soporta login por identifier, username o email según el cliente. */
      const identifier = payload.identifier ?? payload.username ?? payload.email;
      if (!identifier?.trim() || !payload.password?.trim()) {
        throw new HttpError(400, 'identifier y password son obligatorios.');
      }

      flow.validate();

      const dbUser = await this.authRepository.findUserByIdentifier(identifier);
      if (!dbUser) {
        throw new HttpError(401, 'Credenciales inválidas.');
      }

      /** Compara hash y emite JWT solo cuando credenciales son válidas. */
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

  /** Lista permisos RBAC del usuario. */
  async getPermissions(userId: number): Promise<string[]> {
    return this.authRepository.findPermissionsByUserId(userId);
  }

  /** Recupera perfil por id o falla con 404. */
  async getUserById(userId: number): Promise<AuthUser> {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new HttpError(404, 'Usuario no encontrado.');
    }

    return user;
  }

  /** Actualiza nombre/correo validando unicidad de email. */
  async updateProfile(userId: number, payload: UpdateProfileRequest): Promise<AuthUser> {
    if (!payload.name?.trim() || !payload.email?.trim()) {
      throw new HttpError(400, 'name y email son obligatorios para actualizar el perfil.');
    }

    const existing = await this.authRepository.findUserByEmail(payload.email);
    if (existing && existing.id !== userId) {
      throw new HttpError(409, 'El correo ingresado ya está registrado por otro usuario.');
    }

    return this.authRepository.updateProfileByUserId(userId, {
      name: payload.name,
      email: payload.email,
    });
  }

  /** Actualiza contraseña persistiendo nuevo hash. */
  async updatePassword(userId: number, payload: UpdatePasswordRequest): Promise<void> {
    if (!payload.newPassword?.trim()) {
      throw new HttpError(400, 'newPassword es obligatoria.');
    }

    this.ensurePasswordStrength(payload.newPassword);
    const passwordHash = await bcrypt.hash(payload.newPassword, 12);
    await this.authRepository.updatePasswordByUserId(userId, passwordHash);
  }
}
