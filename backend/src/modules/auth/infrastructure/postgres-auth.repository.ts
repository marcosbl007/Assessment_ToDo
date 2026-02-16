import { pool } from '../../../db/pool';
import type { AuthRepository, UnitAndRoleIds, UserWithPassword } from '../application/ports/AuthRepository';
import type { AuthUser, RegisterRequest } from '../auth.types';

const REGISTER_SELECT = `
  SELECT
    u.id,
    u.username,
    u.full_name AS name,
    u.email,
    ou.name AS "organizationalUnit",
    r.code AS role
  FROM users u
  INNER JOIN organizational_units ou ON ou.id = u.organizational_unit_id
  INNER JOIN roles r ON r.id = u.role_id
  WHERE u.id = $1
`;

export class PostgresAuthRepository implements AuthRepository {
  async findUserById(userId: number): Promise<AuthUser | null> {
    const { rows } = await pool.query<AuthUser>(REGISTER_SELECT, [userId]);
    return rows[0] ?? null;
  }

  async findUserByIdentifier(identifier: string): Promise<UserWithPassword | null> {
    const normalized = identifier.trim().toLowerCase();

    const query = `
      SELECT
        u.id,
        u.username,
        u.full_name AS name,
        u.email,
        u.password_hash AS "passwordHash",
        ou.name AS "organizationalUnit",
        r.code AS role
      FROM users u
      INNER JOIN organizational_units ou ON ou.id = u.organizational_unit_id
      INNER JOIN roles r ON r.id = u.role_id
      WHERE lower(u.email) = $1 OR lower(u.username) = $1
      LIMIT 1
    `;

    const { rows } = await pool.query<UserWithPassword>(query, [normalized]);
    return rows[0] ?? null;
  }

  async findUserByEmail(email: string): Promise<AuthUser | null> {
    const normalized = email.trim().toLowerCase();

    const query = `
      SELECT
        u.id,
        u.username,
        u.full_name AS name,
        u.email,
        ou.name AS "organizationalUnit",
        r.code AS role
      FROM users u
      INNER JOIN organizational_units ou ON ou.id = u.organizational_unit_id
      INNER JOIN roles r ON r.id = u.role_id
      WHERE lower(u.email) = $1
      LIMIT 1
    `;

    const { rows } = await pool.query<AuthUser>(query, [normalized]);
    return rows[0] ?? null;
  }

  async findUnitAndRoleIds(organizationalUnit: string, roleCode: string): Promise<UnitAndRoleIds | null> {
    const query = `
      SELECT
        ou.id AS "unitId",
        r.id AS "roleId"
      FROM organizational_units ou
      CROSS JOIN roles r
      WHERE lower(ou.name) = lower($1)
        AND r.code = $2
      LIMIT 1
    `;

    const { rows } = await pool.query<UnitAndRoleIds>(query, [organizationalUnit.trim(), roleCode]);
    return rows[0] ?? null;
  }

  async createUser(payload: RegisterRequest, passwordHash: string, unitId: number, roleId: number): Promise<AuthUser> {
    const insert = `
      INSERT INTO users (username, full_name, email, password_hash, organizational_unit_id, role_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;

    const normalizedEmail = payload.email.trim().toLowerCase();
    const normalizedUsername = payload.username?.trim() ? payload.username.trim().toLowerCase() : null;

    const { rows } = await pool.query<{ id: number }>(insert, [
      normalizedUsername,
      payload.name.trim(),
      normalizedEmail,
      passwordHash,
      unitId,
      roleId,
    ]);

    const createdUserId = rows[0]?.id;
    if (!createdUserId) {
      throw new Error('No se pudo crear el usuario');
    }

    const result = await pool.query<AuthUser>(REGISTER_SELECT, [createdUserId]);
    const user = result.rows[0];

    if (!user) {
      throw new Error('Usuario creado pero no recuperable');
    }

    return user;
  }

  async findPermissionsByUserId(userId: number): Promise<string[]> {
    const query = `
      SELECT p.code
      FROM users u
      INNER JOIN roles r ON r.id = u.role_id
      INNER JOIN role_permissions rp ON rp.role_id = r.id
      INNER JOIN permissions p ON p.id = rp.permission_id
      WHERE u.id = $1
    `;

    const { rows } = await pool.query<{ code: string }>(query, [userId]);
    return rows.map((row) => row.code);
  }

  async updateProfileByUserId(userId: number, data: { name: string; email: string }): Promise<AuthUser> {
    const updateQuery = `
      UPDATE users
      SET full_name = $2,
          email = $3
      WHERE id = $1
      RETURNING id
    `;

    const normalizedEmail = data.email.trim().toLowerCase();
    const { rows } = await pool.query<{ id: number }>(updateQuery, [userId, data.name.trim(), normalizedEmail]);

    const updatedUserId = rows[0]?.id;
    if (!updatedUserId) {
      throw new Error('No se pudo actualizar el perfil del usuario.');
    }

    const result = await pool.query<AuthUser>(REGISTER_SELECT, [updatedUserId]);
    const user = result.rows[0];

    if (!user) {
      throw new Error('Perfil actualizado pero no recuperable.');
    }

    return user;
  }

  async updatePasswordByUserId(userId: number, passwordHash: string): Promise<void> {
    const query = `
      UPDATE users
      SET password_hash = $2
      WHERE id = $1
    `;

    await pool.query(query, [userId, passwordHash]);
  }
}
