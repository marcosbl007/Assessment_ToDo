import { pool } from '../../db/pool';
import type {
  ApprovalDecision,
  ChangeRequestCreated,
  ChangeRequestDecisionResult,
  PendingChangeRequest,
  PublicTask,
} from './tasks.types';

interface UnitRef {
  id: number;
}

interface TaskUnitRef {
  id: number;
  organizationalUnitId: number;
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
        approved_by AS "approvedBy"
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
}
