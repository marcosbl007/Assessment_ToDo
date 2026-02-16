/**
 * - Contrato del repositorio para operaciones de autenticación.
 * - Desacopla `AuthService` de detalles de infraestructura.
 */
import type { AuthUser, RegisterRequest } from '../../auth.types';

export interface UserWithPassword extends AuthUser {
  passwordHash: string;
}

export interface UnitAndRoleIds {
  unitId: number;
  roleId: number;
}

export interface AuthRepository {
  findUserByIdentifier(identifier: string): Promise<UserWithPassword | null>;
  findUserByEmail(email: string): Promise<AuthUser | null>;
  findUserById(userId: number): Promise<AuthUser | null>;
  findUnitAndRoleIds(organizationalUnit: string, roleCode: string): Promise<UnitAndRoleIds | null>;
  createUser(payload: RegisterRequest, passwordHash: string, unitId: number, roleId: number): Promise<AuthUser>;
  findPermissionsByUserId(userId: number): Promise<string[]>;
  updateProfileByUserId(userId: number, data: { name: string; email: string }): Promise<AuthUser>;
  updatePasswordByUserId(userId: number, passwordHash: string): Promise<void>;
}
