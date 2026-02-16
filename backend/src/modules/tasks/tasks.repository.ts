/**
 * - Capa de acceso a datos para tareas, solicitudes y reportes.
 * - Encapsula SQL y mapeos hacia tipos de dominio.
 */
import { pool } from '../../db/pool';
import type {
  ApprovalStatus,
  ApprovalDecision,
  ChangeRequestCreated,
  ChangeRequestDecisionResult,
  PendingChangeRequest,
  PublicTask,
  ReportHistoryItem,
  SupervisorReportSnapshot,
  TaskPriorityDistribution,
  TaskStatusDistribution,
  UnitUser,
} from './tasks.types';

interface UnitRef {
  id: number;
}

interface TaskUnitRef {
  id: number;
  organizationalUnitId: number;
}

interface UserUnitRef {
  id: number;
}

export class TasksRepository {
  /** Inserta una tarea aprobada directamente por supervisor. */
  async createApprovedTaskDirect(params: {
    organizationalUnitId: number;
    createdByUserId: number;
    title: string;
    description: string | null;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    dueDate: string | null;
    assignedToUserId: number | null;
  }): Promise<number> {
    /** Inserción base de tarea con aprobador igual al creador. */
    const query = `
      INSERT INTO tasks (
        organizational_unit_id,
        title,
        description,
        status,
        priority,
        due_date,
        assigned_to_user_id,
        created_by_user_id,
        approved_by_user_id
      )
      VALUES ($1, $2, $3, 'PENDING', $4::task_priority, $5::date, $6, $7, $7)
      RETURNING id
    `;

    const { rows } = await pool.query<{ id: string }>(query, [
      params.organizationalUnitId,
      params.title,
      params.description,
      params.priority,
      params.dueDate,
      params.assignedToUserId,
      params.createdByUserId,
    ]);

    /** Convierte id textual de PostgreSQL a number para mantener contrato tipado. */
    const taskId = rows[0]?.id ? Number(rows[0].id) : NaN;
    if (!Number.isInteger(taskId) || taskId <= 0) {
      throw new Error('No se pudo crear la tarea aprobada de forma directa.');
    }

    return taskId;
  }

  /** Lista tareas públicas aprobadas por unidad; puede filtrar por asignado. */
  async findApprovedTasksByUnit(unitName: string, assignedToUserId?: number): Promise<PublicTask[]> {
    /** Vista pública con campos normalizados para frontend. */
    const query = `
      SELECT
        id,
        title,
        description,
        status,
        priority,
        due_date AS "dueDate",
        completed_at AS "completedAt",
        created_at AS "createdAt",
        organizational_unit_code AS "organizationalUnitCode",
        organizational_unit_name AS "organizationalUnitName",
        created_by AS "createdBy",
        approved_by AS "approvedBy",
        assigned_to_user_id AS "assignedToUserId",
        assigned_to AS "assignedTo"
      FROM vw_tasks_public
      WHERE lower(organizational_unit_name) = lower($1)
        AND ($2::bigint IS NULL OR assigned_to_user_id = $2::bigint)
      ORDER BY created_at DESC
    `;

    const { rows } = await pool.query<PublicTask>(query, [unitName.trim(), assignedToUserId ?? null]);
    return rows;
  }

  /** Lista solicitudes del usuario autenticado en su unidad y estado opcional. */
  async findOwnChangeRequests(
    userId: number,
    unitName: string,
    status?: ApprovalStatus,
  ): Promise<PendingChangeRequest[]> {
    /** Consulta base para historial propio de solicitudes. */
    const query = `
      SELECT
        r.id,
        r.task_id AS "taskId",
        r.change_type AS "changeType",
        r.status,
        r.reason,
        r.payload,
        r.requested_at AS "requestedAt",
        requester.full_name AS "requestedBy",
        ou.code AS "organizationalUnitCode",
        ou.name AS "organizationalUnitName",
        COALESCE(t.title, r.payload ->> 'title') AS "currentTaskTitle"
      FROM task_change_requests r
      INNER JOIN organizational_units ou ON ou.id = r.organizational_unit_id
      INNER JOIN users requester ON requester.id = r.requested_by_user_id
      LEFT JOIN tasks t ON t.id = r.task_id
      WHERE r.requested_by_user_id = $1
        AND lower(ou.name) = lower($2)
        AND ($3::approval_status IS NULL OR r.status = $3::approval_status)
      ORDER BY r.requested_at DESC
    `;

    const { rows } = await pool.query<PendingChangeRequest>(query, [userId, unitName.trim(), status ?? null]);
    return rows;
  }

  /** Lista solicitudes pendientes de estándares para revisión de supervisor. */
  async findPendingChangeRequestsByUnit(unitName: string): Promise<PendingChangeRequest[]> {
    /** Pendientes por unidad ordenadas por antigüedad. */
    const query = `
      SELECT
        r.id,
        r.task_id AS "taskId",
        r.change_type AS "changeType",
        r.status,
        r.reason,
        r.payload,
        r.requested_at AS "requestedAt",
        requester.full_name AS "requestedBy",
        ou.code AS "organizationalUnitCode",
        ou.name AS "organizationalUnitName",
        t.title AS "currentTaskTitle"
      FROM task_change_requests r
      INNER JOIN organizational_units ou ON ou.id = r.organizational_unit_id
      INNER JOIN users requester ON requester.id = r.requested_by_user_id
      INNER JOIN roles requester_role ON requester_role.id = requester.role_id
      LEFT JOIN tasks t ON t.id = r.task_id
      WHERE r.status = 'PENDING'
        AND requester_role.code = 'STANDARD'
        AND lower(ou.name) = lower($1)
      ORDER BY r.requested_at ASC
    `;

    const { rows } = await pool.query<PendingChangeRequest>(query, [unitName.trim()]);
    return rows;
  }

  /** Ejecuta el procedimiento que aprueba/rechaza y aplica cambios. */
  async applyChangeRequestDecision(
    requestId: number,
    supervisorUserId: number,
    decision: ApprovalDecision,
    reviewComment?: string,
  ): Promise<ChangeRequestDecisionResult> {
    /** Wrapper del procedimiento almacenado de decisión. */
    const query = `
      SELECT
        change_request_id AS "changeRequestId",
        status::text AS status,
        task_id AS "taskId"
      FROM apply_task_change_request($1, $2, $3::approval_status, $4)
    `;

    const { rows } = await pool.query<ChangeRequestDecisionResult>(query, [
      requestId,
      supervisorUserId,
      decision,
      reviewComment ?? null,
    ]);

    const result = rows[0];
    if (!result) {
      throw new Error('No se pudo resolver la solicitud de cambio.');
    }

    return result;
  }

  /** Resuelve id de unidad por nombre (case-insensitive). */
  async findUnitIdByName(unitName: string): Promise<number | null> {
    const query = `
      SELECT id
      FROM organizational_units
      WHERE lower(name) = lower($1)
      LIMIT 1
    `;

    const { rows } = await pool.query<UnitRef>(query, [unitName.trim()]);
    return rows[0]?.id ?? null;
  }

  /** Obtiene tarea activa y su unidad propietaria. */
  async findTaskById(taskId: number): Promise<TaskUnitRef | null> {
    const query = `
      SELECT
        id,
        organizational_unit_id AS "organizationalUnitId"
      FROM tasks
      WHERE id = $1
        AND is_active = TRUE
      LIMIT 1
    `;

    const { rows } = await pool.query<TaskUnitRef>(query, [taskId]);
    return rows[0] ?? null;
  }

  /** Crea registro de solicitud para flujos CREATE/UPDATE/COMPLETE/DELETE. */
  async createChangeRequest(params: {
    taskId: number | null;
    organizationalUnitId: number;
    requestedByUserId: number;
    changeType: 'CREATE' | 'UPDATE' | 'COMPLETE' | 'DELETE';
    reason: string | null;
    payload: Record<string, unknown>;
  }): Promise<ChangeRequestCreated> {
    /** Inserción de solicitud con payload flexible en JSONB. */
    const query = `
      INSERT INTO task_change_requests (
        task_id,
        organizational_unit_id,
        requested_by_user_id,
        change_type,
        reason,
        payload
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      RETURNING
        id,
        change_type AS "changeType",
        status,
        requested_at AS "requestedAt"
    `;

    const { rows } = await pool.query<ChangeRequestCreated>(query, [
      params.taskId,
      params.organizationalUnitId,
      params.requestedByUserId,
      params.changeType,
      params.reason,
      JSON.stringify(params.payload),
    ]);

    /** Garantiza que la inserción retornó metadata mínima de la solicitud. */
    const created = rows[0];
    if (!created) {
      throw new Error('No se pudo crear la solicitud de cambio.');
    }

    return created;
  }

  /** Obtiene usuarios activos de la unidad para selector de asignación. */
  async findUnitUsers(unitName: string): Promise<UnitUser[]> {
    const query = `
      SELECT
        u.id,
        u.full_name AS name,
        u.email,
        r.code AS role
      FROM users u
      INNER JOIN organizational_units ou ON ou.id = u.organizational_unit_id
      INNER JOIN roles r ON r.id = u.role_id
      WHERE u.is_active = TRUE
        AND lower(ou.name) = lower($1)
      ORDER BY u.full_name ASC
    `;

    const { rows } = await pool.query<UnitUser>(query, [unitName.trim()]);
    return rows;
  }

  /** Verifica que un usuario activo pertenezca a la unidad indicada. */
  async findUserInUnit(userId: number, unitId: number): Promise<UserUnitRef | null> {
    const query = `
      SELECT id
      FROM users
      WHERE id = $1
        AND organizational_unit_id = $2
        AND is_active = TRUE
      LIMIT 1
    `;

    const { rows } = await pool.query<UserUnitRef>(query, [userId, unitId]);
    return rows[0] ?? null;
  }

  /** Construye snapshot agregado para tarjetas y gráficas del dashboard supervisor. */
  async getSupervisorReportSnapshot(unitName: string): Promise<SupervisorReportSnapshot> {
    /** Resumen general de estados activos en la unidad. */
    const summaryQuery = `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE t.status = 'COMPLETED')::int AS "completed",
        0::int AS "inProgress",
        COUNT(*) FILTER (WHERE t.status IN ('PENDING', 'IN_PROGRESS'))::int AS "pending"
      FROM tasks t
      INNER JOIN organizational_units ou ON ou.id = t.organizational_unit_id
      WHERE t.is_active = TRUE
        AND lower(ou.name) = lower($1)
    `;

    /** Conteo de solicitudes pendientes de aprobación. */
    const pendingApprovalsQuery = `
      SELECT COUNT(*)::int AS count
      FROM task_change_requests r
      INNER JOIN organizational_units ou ON ou.id = r.organizational_unit_id
      WHERE r.status = 'PENDING'
        AND lower(ou.name) = lower($1)
    `;

    /** Conteo de solicitudes rechazadas para indicador de riesgo. */
    const rejectedCountQuery = `
      SELECT COUNT(*)::int AS count
      FROM task_change_requests r
      INNER JOIN organizational_units ou ON ou.id = r.organizational_unit_id
      WHERE r.status = 'REJECTED'
        AND lower(ou.name) = lower($1)
    `;

    /** Distribución de prioridades en tareas completadas. */
    const priorityQuery = `
      SELECT
        COUNT(*) FILTER (WHERE t.priority = 'HIGH')::int AS high,
        COUNT(*) FILTER (WHERE t.priority = 'MEDIUM')::int AS medium,
        COUNT(*) FILTER (WHERE t.priority = 'LOW')::int AS low
      FROM tasks t
      INNER JOIN organizational_units ou ON ou.id = t.organizational_unit_id
      WHERE t.is_active = TRUE
        AND t.status = 'COMPLETED'
        AND lower(ou.name) = lower($1)
    `;

    /** Historial consolidado (solicitudes + altas directas de supervisor). */
    const historyQuery = `
      WITH request_history AS (
        SELECT
          COALESCE(r.task_id, t.id)::bigint AS id,
          COALESCE(t.title, r.payload ->> 'title', 'Tarea sin título') AS "taskTitle",
          COALESCE(t.priority::text, (r.payload ->> 'priority'), 'MEDIUM')::text AS priority,
          CASE
            WHEN r.status = 'REJECTED' THEN 'REJECTED'
            WHEN t.status = 'COMPLETED' THEN 'COMPLETED'
            ELSE 'PENDING'
          END::text AS status,
          COALESCE(r.reviewed_at, t.updated_at, t.created_at)::timestamptz AS "endDate"
        FROM task_change_requests r
        LEFT JOIN tasks t ON t.id = r.task_id
        INNER JOIN organizational_units ou ON ou.id = r.organizational_unit_id
        WHERE r.status IN ('APPROVED', 'REJECTED')
          AND lower(ou.name) = lower($1)
      ),
      direct_supervisor_creations AS (
        SELECT
          t.id::bigint AS id,
          t.title AS "taskTitle",
          t.priority::text AS priority,
          CASE
            WHEN t.status = 'COMPLETED' THEN 'COMPLETED'
            ELSE 'PENDING'
          END::text AS status,
          t.created_at::timestamptz AS "endDate"
        FROM tasks t
        INNER JOIN organizational_units ou ON ou.id = t.organizational_unit_id
        INNER JOIN users creator ON creator.id = t.created_by_user_id
        INNER JOIN roles creator_role ON creator_role.id = creator.role_id
        WHERE lower(ou.name) = lower($1)
          AND creator_role.code = 'SUPERVISOR'
          AND t.approved_by_user_id = t.created_by_user_id
          AND NOT EXISTS (
            SELECT 1
            FROM task_change_requests r
            WHERE r.change_type = 'CREATE'
              AND r.task_id = t.id
          )
      )
      SELECT *
      FROM (
        SELECT * FROM request_history
        UNION ALL
        SELECT * FROM direct_supervisor_creations
      ) AS history
      ORDER BY "endDate" DESC
      LIMIT 12
    `;

    const [summaryResult, pendingApprovalsResult, rejectedResult, priorityResult, historyResult] = await Promise.all([
      /** Ejecuta consultas en paralelo para reducir latencia del dashboard. */
      pool.query<{ total: number; completed: number; inProgress: number; pending: number }>(summaryQuery, [unitName.trim()]),
      pool.query<{ count: number }>(pendingApprovalsQuery, [unitName.trim()]),
      pool.query<{ count: number }>(rejectedCountQuery, [unitName.trim()]),
      pool.query<TaskPriorityDistribution>(priorityQuery, [unitName.trim()]),
      pool.query<ReportHistoryItem>(historyQuery, [unitName.trim()]),
    ]);

    /** Aplica defaults defensivos para evitar null/undefined en serialización API. */
    const summary = summaryResult.rows[0] ?? { total: 0, completed: 0, inProgress: 0, pending: 0 };
    const pendingApprovals = pendingApprovalsResult.rows[0]?.count ?? 0;
    const rejected = rejectedResult.rows[0]?.count ?? 0;
    const priority = priorityResult.rows[0] ?? { high: 0, medium: 0, low: 0 };

    /** Mapea campos agregados al shape consumido por tarjetas y gráficas. */
    const statusDistribution: TaskStatusDistribution = {
      completed: summary.completed,
      inProgress: summary.inProgress,
      pending: summary.pending,
      rejected,
    };

    return {
      total: summary.total,
      completed: summary.completed,
      inProgress: summary.inProgress,
      pending: summary.pending,
      pendingApprovals,
      statusDistribution,
      priorityDistribution: {
        high: priority.high,
        medium: priority.medium,
        low: priority.low,
      },
      history: historyResult.rows,
    };
  }
}
