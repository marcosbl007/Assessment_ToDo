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
  findUnitAndRoleIds(organizationalUnit: string, roleCode: string): Promise<UnitAndRoleIds | null>;
  createUser(payload: RegisterRequest, passwordHash: string, unitId: number, roleId: number): Promise<AuthUser>;
  findPermissionsByUserId(userId: number): Promise<string[]>;
}
