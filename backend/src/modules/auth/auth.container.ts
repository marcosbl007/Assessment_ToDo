import { PostgresAuthRepository } from './infrastructure/postgres-auth.repository';
import { RoleNormalizationContext } from './application/strategies/role.strategy';
import { AuthService } from './application/services/auth.service';
import { MailService } from '../../shared/services/mail.service';

const authRepository = new PostgresAuthRepository();
const roleNormalizationContext = new RoleNormalizationContext();
const mailService = new MailService();

export const authService = new AuthService(authRepository, roleNormalizationContext, mailService);
