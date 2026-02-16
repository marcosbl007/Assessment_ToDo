import { pool } from '../../db/pool';
import type {
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
  async findApprovedTasks(): Promise<PublicTask[]> {
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
      ORDER BY created_at DESC
    `;

    const { rows } = await pool.query<PublicTask>(query);
    return rows;
  }

  async findPendingChangeRequestsByUnit(unitName: string): Promise<PendingChangeRequest[]> {
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
      LEFT JOIN tasks t ON t.id = r.task_id
      WHERE r.status = 'PENDING'
        AND lower(ou.name) = lower($1)
      ORDER BY r.requested_at ASC
    `;

    const { rows } = await pool.query<PendingChangeRequest>(query, [unitName.trim()]);
    return rows;
  }

  async applyChangeRequestDecision(
    requestId: number,
    supervisorUserId: number,
    decision: ApprovalDecision,
    reviewComment?: string,
  ): Promise<ChangeRequestDecisionResult> {
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

  async createChangeRequest(params: {
    taskId: number | null;
    organizationalUnitId: number;
    requestedByUserId: number;
    changeType: 'CREATE' | 'UPDATE' | 'COMPLETE' | 'DELETE';
    reason: string | null;
    payload: Record<string, unknown>;
  }): Promise<ChangeRequestCreated> {
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

    const created = rows[0];
    if (!created) {
      throw new Error('No se pudo crear la solicitud de cambio.');
    }

    return created;
  }

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

  async getSupervisorReportSnapshot(unitName: string): Promise<SupervisorReportSnapshot> {
    const summaryQuery = `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE t.status = 'COMPLETED')::int AS "completed",
        COUNT(*) FILTER (WHERE t.status = 'IN_PROGRESS')::int AS "inProgress",
        COUNT(*) FILTER (WHERE t.status = 'PENDING')::int AS "pending"
      FROM tasks t
      INNER JOIN organizational_units ou ON ou.id = t.organizational_unit_id
      WHERE t.is_active = TRUE
        AND lower(ou.name) = lower($1)
    `;

    const pendingApprovalsQuery = `
      SELECT COUNT(*)::int AS count
      FROM task_change_requests r
      INNER JOIN organizational_units ou ON ou.id = r.organizational_unit_id
      WHERE r.status = 'PENDING'
        AND lower(ou.name) = lower($1)
    `;

    const rejectedCountQuery = `
      SELECT COUNT(*)::int AS count
      FROM task_change_requests r
      INNER JOIN organizational_units ou ON ou.id = r.organizational_unit_id
      WHERE r.status = 'REJECTED'
        AND lower(ou.name) = lower($1)
    `;

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

    const historyQuery = `
      SELECT
        COALESCE(r.task_id, t.id)::bigint AS id,
        COALESCE(t.title, r.payload ->> 'title', 'Tarea sin título') AS "taskTitle",
        COALESCE(t.priority::text, (r.payload ->> 'priority'), 'MEDIUM')::text AS priority,
        CASE
          WHEN r.status = 'REJECTED' THEN 'REJECTED'
          WHEN t.status = 'COMPLETED' THEN 'COMPLETED'
          WHEN t.status = 'IN_PROGRESS' THEN 'IN_PROGRESS'
          ELSE 'IN_PROGRESS'
        END::text AS status,
        COALESCE(r.reviewed_at, t.updated_at, t.created_at)::timestamptz AS "endDate"
      FROM task_change_requests r
      LEFT JOIN tasks t ON t.id = r.task_id
      INNER JOIN organizational_units ou ON ou.id = r.organizational_unit_id
      WHERE r.status IN ('APPROVED', 'REJECTED')
        AND lower(ou.name) = lower($1)
      ORDER BY COALESCE(r.reviewed_at, t.updated_at, t.created_at) DESC
      LIMIT 12
    `;

    const [summaryResult, pendingApprovalsResult, rejectedResult, priorityResult, historyResult] = await Promise.all([
      pool.query<{ total: number; completed: number; inProgress: number; pending: number }>(summaryQuery, [unitName.trim()]),
      pool.query<{ count: number }>(pendingApprovalsQuery, [unitName.trim()]),
      pool.query<{ count: number }>(rejectedCountQuery, [unitName.trim()]),
      pool.query<TaskPriorityDistribution>(priorityQuery, [unitName.trim()]),
      pool.query<ReportHistoryItem>(historyQuery, [unitName.trim()]),
    ]);

    const summary = summaryResult.rows[0] ?? { total: 0, completed: 0, inProgress: 0, pending: 0 };
    const pendingApprovals = pendingApprovalsResult.rows[0]?.count ?? 0;
    const rejected = rejectedResult.rows[0]?.count ?? 0;
    const priority = priorityResult.rows[0] ?? { high: 0, medium: 0, low: 0 };

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
