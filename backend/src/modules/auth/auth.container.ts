/**
 * - Composición de dependencias del módulo auth.
 * - Expone una instancia única de `authService` para la aplicación.
 */
import { PostgresAuthRepository } from './infrastructure/postgres-auth.repository';
import { RoleNormalizationContext } from './application/strategies/role.strategy';
import { AuthService } from './application/services/auth.service';
import { MailService } from '../../shared/services/mail.service';

const authRepository = new PostgresAuthRepository();
const roleNormalizationContext = new RoleNormalizationContext();
const mailService = new MailService();

/** Servicio singleton de autenticación utilizado por controladores y middlewares. */
export const authService = new AuthService(authRepository, roleNormalizationContext, mailService);
