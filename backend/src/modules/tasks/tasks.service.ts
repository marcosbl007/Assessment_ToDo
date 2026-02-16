import { HttpError } from '../../shared/errors/HttpError';
import type { RoleCode } from '../auth/application/strategies/role.strategy';
import { TasksRepository } from './tasks.repository';
import type {
  ApprovalStatus,
  ChangeRequestCreated,
  ChangeRequestDecisionInput,
  ChangeRequestDecisionResult,
  CompleteTaskRequestInput,
  CreateTaskRequestInput,
  DeleteTaskRequestInput,
  PendingChangeRequest,
  PublicTask,
  SupervisorReportSnapshot,
  TaskPriority,
  TaskStatus,
  UnitUser,
  UpdateTaskRequestInput,
} from './tasks.types';

export class TasksService {
  constructor(private readonly tasksRepository: TasksRepository) {}

  private readonly allowedPriorities: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH'];

  private readonly allowedStatuses: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

  private readonly allowedApprovalStatuses: ApprovalStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];

  private assertValidPriority(priority?: string): void {
    if (!priority) {
      return;
    }

    if (!this.allowedPriorities.includes(priority as TaskPriority)) {
      throw new HttpError(400, 'priority inválida. Usa LOW, MEDIUM o HIGH.');
    }
  }

  private assertValidStatus(status?: string): void {
    if (!status) {
      return;
    }

    if (!this.allowedStatuses.includes(status as TaskStatus)) {
      throw new HttpError(400, 'status inválido. Usa PENDING, IN_PROGRESS o COMPLETED.');
    }
  }

  private async resolveUserUnitId(unitName: string): Promise<number> {
    const unitId = await this.tasksRepository.findUnitIdByName(unitName);
    if (!unitId) {
      throw new HttpError(400, 'No se encontró la unidad organizacional del usuario.');
    }

    return unitId;
  }

  private async ensureTaskBelongsToUnit(taskId: number, unitId: number): Promise<void> {
    const task = await this.tasksRepository.findTaskById(taskId);
    if (!task) {
      throw new HttpError(404, 'La tarea indicada no existe o está inactiva.');
    }

    if (task.organizationalUnitId !== unitId) {
      throw new HttpError(403, 'Solo puedes operar tareas de tu unidad organizacional.');
    }
  }

  private async ensureAssigneeBelongsToUnit(assigneeId: number, unitId: number): Promise<void> {
    const user = await this.tasksRepository.findUserInUnit(assigneeId, unitId);
    if (!user) {
      throw new HttpError(400, 'El usuario asignado no pertenece a tu unidad o no está activo.');
    }
  }

  private async autoApproveIfSupervisor(
    requesterRole: RoleCode,
    requesterUserId: number,
    requestId: number,
  ): Promise<void> {
    if (requesterRole !== 'SUPERVISOR') {
      return;
    }

    await this.tasksRepository.applyChangeRequestDecision(
      requestId,
      requesterUserId,
      'APPROVED',
      'Autoaprobada por supervisor al momento de registrar el cambio.',
    );
  }

  async getApprovedTasks(unitName: string, role: RoleCode, userId: number): Promise<PublicTask[]> {
    if (!unitName?.trim()) {
      throw new HttpError(400, 'No se pudo determinar la unidad organizacional del usuario.');
    }

    const assignedFilter = role === 'STANDARD' ? userId : undefined;
    return this.tasksRepository.findApprovedTasksByUnit(unitName, assignedFilter);
  }

  async getOwnChangeRequests(
    userId: number,
    unitName: string,
    status?: ApprovalStatus,
  ): Promise<PendingChangeRequest[]> {
    if (!unitName?.trim()) {
      throw new HttpError(400, 'No se pudo determinar la unidad organizacional del usuario.');
    }

    if (status && !this.allowedApprovalStatuses.includes(status)) {
      throw new HttpError(400, 'status inválido. Usa PENDING, APPROVED o REJECTED.');
    }

    return this.tasksRepository.findOwnChangeRequests(userId, unitName, status);
  }

  async getPendingRequestsForSupervisor(unitName: string, role: RoleCode): Promise<PendingChangeRequest[]> {
    if (role !== 'SUPERVISOR') {
      throw new HttpError(403, 'Solo un supervisor puede consultar solicitudes pendientes.');
    }

    if (!unitName?.trim()) {
      throw new HttpError(400, 'No se pudo determinar la unidad organizacional del supervisor.');
    }

    return this.tasksRepository.findPendingChangeRequestsByUnit(unitName);
  }

  async getUnitUsers(unitName: string): Promise<UnitUser[]> {
    if (!unitName?.trim()) {
      throw new HttpError(400, 'No se pudo determinar la unidad organizacional del usuario.');
    }

    return this.tasksRepository.findUnitUsers(unitName);
  }

  async getSupervisorReportSnapshot(unitName: string): Promise<SupervisorReportSnapshot> {
    if (!unitName?.trim()) {
      throw new HttpError(400, 'No se pudo determinar la unidad organizacional del supervisor.');
    }

    return this.tasksRepository.getSupervisorReportSnapshot(unitName);
  }

  async decidePendingRequest(
    supervisorUserId: number,
    supervisorRole: RoleCode,
    requestId: number,
    payload: ChangeRequestDecisionInput,
  ): Promise<ChangeRequestDecisionResult> {
    if (supervisorRole !== 'SUPERVISOR') {
      throw new HttpError(403, 'Solo un supervisor puede aprobar o rechazar solicitudes.');
    }

    if (!Number.isInteger(requestId) || requestId <= 0) {
      throw new HttpError(400, 'requestId inválido.');
    }

    if (payload.decision !== 'APPROVED' && payload.decision !== 'REJECTED') {
      throw new HttpError(400, 'decision debe ser APPROVED o REJECTED.');
    }

    return this.tasksRepository.applyChangeRequestDecision(
      requestId,
      supervisorUserId,
      payload.decision,
      payload.reviewComment,
    );
  }

  async requestTaskCreation(
    userId: number,
    role: RoleCode,
    unitName: string,
    payload: CreateTaskRequestInput,
  ): Promise<ChangeRequestCreated> {
    if (!payload.title?.trim()) {
      throw new HttpError(400, 'title es obligatorio para crear una tarea.');
    }

    this.assertValidPriority(payload.priority);
    const unitId = await this.resolveUserUnitId(unitName);

    if (payload.assignedToUserId !== undefined && payload.assignedToUserId !== null) {
      if (!Number.isInteger(payload.assignedToUserId) || payload.assignedToUserId <= 0) {
        throw new HttpError(400, 'assignedToUserId inválido.');
      }

      await this.ensureAssigneeBelongsToUnit(payload.assignedToUserId, unitId);
    }

    if (role === 'SUPERVISOR') {
      const createdTaskId = await this.tasksRepository.createApprovedTaskDirect({
        organizationalUnitId: unitId,
        createdByUserId: userId,
        title: payload.title.trim(),
        description: payload.description?.trim() || null,
        priority: payload.priority ?? 'MEDIUM',
        dueDate: payload.dueDate ?? null,
        assignedToUserId: payload.assignedToUserId ?? null,
      });

      return {
        id: createdTaskId,
        changeType: 'CREATE',
        status: 'APPROVED',
        requestedAt: new Date().toISOString(),
      };
    }

    const request = await this.tasksRepository.createChangeRequest({
      taskId: null,
      organizationalUnitId: unitId,
      requestedByUserId: userId,
      changeType: 'CREATE',
      reason: payload.reason?.trim() || null,
      payload: {
        title: payload.title.trim(),
        description: payload.description?.trim() || null,
        priority: payload.priority ?? 'MEDIUM',
        dueDate: payload.dueDate ?? null,
        assignedToUserId: payload.assignedToUserId ?? null,
      },
    });

    return request;
  }

  async requestTaskUpdate(
    userId: number,
    role: RoleCode,
    unitName: string,
    taskId: number,
    payload: UpdateTaskRequestInput,
  ): Promise<ChangeRequestCreated> {
    if (!Number.isInteger(taskId) || taskId <= 0) {
      throw new HttpError(400, 'taskId inválido.');
    }

    this.assertValidPriority(payload.priority);
    this.assertValidStatus(payload.status);

    if (
      payload.title === undefined &&
      payload.description === undefined &&
      payload.status === undefined &&
      payload.priority === undefined &&
      payload.assignedToUserId === undefined &&
      payload.dueDate === undefined
    ) {
      throw new HttpError(400, 'Debes enviar al menos un campo para actualizar la tarea.');
    }

    const unitId = await this.resolveUserUnitId(unitName);
    await this.ensureTaskBelongsToUnit(taskId, unitId);

    if (payload.assignedToUserId !== undefined && payload.assignedToUserId !== null) {
      if (!Number.isInteger(payload.assignedToUserId) || payload.assignedToUserId <= 0) {
        throw new HttpError(400, 'assignedToUserId inválido.');
      }

      await this.ensureAssigneeBelongsToUnit(payload.assignedToUserId, unitId);
    }

    const request = await this.tasksRepository.createChangeRequest({
      taskId,
      organizationalUnitId: unitId,
      requestedByUserId: userId,
      changeType: 'UPDATE',
      reason: payload.reason?.trim() || null,
      payload: {
        ...(payload.title !== undefined ? { title: payload.title.trim() } : {}),
        ...(payload.description !== undefined ? { description: payload.description.trim() } : {}),
        ...(payload.status !== undefined ? { status: payload.status } : {}),
        ...(payload.priority !== undefined ? { priority: payload.priority } : {}),
        ...(payload.assignedToUserId !== undefined ? { assignedToUserId: payload.assignedToUserId } : {}),
        ...(payload.dueDate !== undefined ? { dueDate: payload.dueDate } : {}),
      },
    });

    await this.autoApproveIfSupervisor(role, userId, request.id);
    return role === 'SUPERVISOR' ? { ...request, status: 'APPROVED' } : request;
  }

  async requestTaskCompletion(
    userId: number,
    role: RoleCode,
    unitName: string,
    taskId: number,
    payload: CompleteTaskRequestInput,
  ): Promise<ChangeRequestCreated> {
    if (!Number.isInteger(taskId) || taskId <= 0) {
      throw new HttpError(400, 'taskId inválido.');
    }

    const unitId = await this.resolveUserUnitId(unitName);
    await this.ensureTaskBelongsToUnit(taskId, unitId);

    const request = await this.tasksRepository.createChangeRequest({
      taskId,
      organizationalUnitId: unitId,
      requestedByUserId: userId,
      changeType: 'COMPLETE',
      reason: payload.reason?.trim() || null,
      payload: {},
    });

    await this.autoApproveIfSupervisor(role, userId, request.id);
    return role === 'SUPERVISOR' ? { ...request, status: 'APPROVED' } : request;
  }

  async requestTaskDeletion(
    userId: number,
    role: RoleCode,
    unitName: string,
    taskId: number,
    payload: DeleteTaskRequestInput,
  ): Promise<ChangeRequestCreated> {
    if (!Number.isInteger(taskId) || taskId <= 0) {
      throw new HttpError(400, 'taskId inválido.');
    }

    const unitId = await this.resolveUserUnitId(unitName);
    await this.ensureTaskBelongsToUnit(taskId, unitId);

    const request = await this.tasksRepository.createChangeRequest({
      taskId,
      organizationalUnitId: unitId,
      requestedByUserId: userId,
      changeType: 'DELETE',
      reason: payload.reason?.trim() || null,
      payload: {},
    });

    await this.autoApproveIfSupervisor(role, userId, request.id);
    return role === 'SUPERVISOR' ? { ...request, status: 'APPROVED' } : request;
  }
}
