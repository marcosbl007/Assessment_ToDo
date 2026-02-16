/**
 * - Reglas de negocio del flujo de tareas para estándar y supervisor.
 * - Valida payloads, permisos funcionales y coordina operaciones del repositorio.
 */
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

  /** Valida prioridad permitida en payload. */
  private assertValidPriority(priority?: string): void {
    if (!priority) {
      return;
    }

    if (!this.allowedPriorities.includes(priority as TaskPriority)) {
      throw new HttpError(400, 'priority inválida. Usa LOW, MEDIUM o HIGH.');
    }
  }

  /** Valida estado permitido en payload. */
  private assertValidStatus(status?: string): void {
    if (!status) {
      return;
    }

    if (!this.allowedStatuses.includes(status as TaskStatus)) {
      throw new HttpError(400, 'status inválido. Usa PENDING, IN_PROGRESS o COMPLETED.');
    }
  }

  /** Resuelve id de unidad a partir del nombre en sesión. */
  private async resolveUserUnitId(unitName: string): Promise<number> {
    const unitId = await this.tasksRepository.findUnitIdByName(unitName);
    if (!unitId) {
      throw new HttpError(400, 'No se encontró la unidad organizacional del usuario.');
    }

    return unitId;
  }

  /** Asegura que la tarea pertenezca a la unidad del solicitante. */
  private async ensureTaskBelongsToUnit(taskId: number, unitId: number): Promise<void> {
    const task = await this.tasksRepository.findTaskById(taskId);
    if (!task) {
      throw new HttpError(404, 'La tarea indicada no existe o está inactiva.');
    }

    if (task.organizationalUnitId !== unitId) {
      throw new HttpError(403, 'Solo puedes operar tareas de tu unidad organizacional.');
    }
  }

  /** Asegura que el asignado exista y sea activo en la misma unidad. */
  private async ensureAssigneeBelongsToUnit(assigneeId: number, unitId: number): Promise<void> {
    const user = await this.tasksRepository.findUserInUnit(assigneeId, unitId);
    if (!user) {
      throw new HttpError(400, 'El usuario asignado no pertenece a tu unidad o no está activo.');
    }
  }

  /** Autoaprueba solicitudes cuando quien ejecuta es supervisor. */
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

  /** Obtiene tareas visibles por rol/unidad. */
  async getApprovedTasks(unitName: string, role: RoleCode, userId: number): Promise<PublicTask[]> {
    if (!unitName?.trim()) {
      throw new HttpError(400, 'No se pudo determinar la unidad organizacional del usuario.');
    }

    const assignedFilter = role === 'STANDARD' ? userId : undefined;
    return this.tasksRepository.findApprovedTasksByUnit(unitName, assignedFilter);
  }

  /** Obtiene solicitudes propias con filtro de estado opcional. */
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

  /** Obtiene solicitudes pendientes para supervisor de unidad. */
  async getPendingRequestsForSupervisor(unitName: string, role: RoleCode): Promise<PendingChangeRequest[]> {
    if (role !== 'SUPERVISOR') {
      throw new HttpError(403, 'Solo un supervisor puede consultar solicitudes pendientes.');
    }

    if (!unitName?.trim()) {
      throw new HttpError(400, 'No se pudo determinar la unidad organizacional del supervisor.');
    }

    return this.tasksRepository.findPendingChangeRequestsByUnit(unitName);
  }

  /** Obtiene catálogo de usuarios activos de la unidad. */
  async getUnitUsers(unitName: string): Promise<UnitUser[]> {
    if (!unitName?.trim()) {
      throw new HttpError(400, 'No se pudo determinar la unidad organizacional del usuario.');
    }

    return this.tasksRepository.findUnitUsers(unitName);
  }

  /** Obtiene snapshot de reportes para vistas de analytics. */
  async getSupervisorReportSnapshot(unitName: string): Promise<SupervisorReportSnapshot> {
    if (!unitName?.trim()) {
      throw new HttpError(400, 'No se pudo determinar la unidad organizacional del supervisor.');
    }

    return this.tasksRepository.getSupervisorReportSnapshot(unitName);
  }

  /** Aplica decisión sobre solicitud pendiente con validaciones de rol/estado. */
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

  /** Crea tarea o solicitud de creación según rol del solicitante. */
  async requestTaskCreation(
    userId: number,
    role: RoleCode,
    unitName: string,
    payload: CreateTaskRequestInput,
  ): Promise<ChangeRequestCreated> {
    /** Validaciones mínimas de entrada para alta de tarea. */
    if (!payload.title?.trim()) {
      throw new HttpError(400, 'title es obligatorio para crear una tarea.');
    }

    this.assertValidPriority(payload.priority);
    const unitId = await this.resolveUserUnitId(unitName);

    /** Si hay asignación explícita, valida id y pertenencia a la unidad. */
    if (payload.assignedToUserId !== undefined && payload.assignedToUserId !== null) {
      if (!Number.isInteger(payload.assignedToUserId) || payload.assignedToUserId <= 0) {
        throw new HttpError(400, 'assignedToUserId inválido.');
      }

      await this.ensureAssigneeBelongsToUnit(payload.assignedToUserId, unitId);
    }

    /** Supervisor crea y aprueba directamente sin pasar por cola de solicitudes. */
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

    /** Usuario estándar: persiste una solicitud pendiente para revisión de supervisor. */
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

  /** Registra actualización (o solicitud) de campos permitidos de una tarea. */
  async requestTaskUpdate(
    userId: number,
    role: RoleCode,
    unitName: string,
    taskId: number,
    payload: UpdateTaskRequestInput,
  ): Promise<ChangeRequestCreated> {
    /** Valida identificador y valores enumerados permitidos. */
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

    /** Si cambia asignación, valida que el destino pertenezca a la misma unidad. */
    if (payload.assignedToUserId !== undefined && payload.assignedToUserId !== null) {
      if (!Number.isInteger(payload.assignedToUserId) || payload.assignedToUserId <= 0) {
        throw new HttpError(400, 'assignedToUserId inválido.');
      }

      await this.ensureAssigneeBelongsToUnit(payload.assignedToUserId, unitId);
    }

    /** Construye payload parcial únicamente con campos presentes en la petición. */
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

    /** Mantiene comportamiento directo de supervisor y flujo pendiente para estándar. */
    await this.autoApproveIfSupervisor(role, userId, request.id);
    return role === 'SUPERVISOR' ? { ...request, status: 'APPROVED' } : request;
  }

  /** Registra operación de completado (directa o solicitada). */
  async requestTaskCompletion(
    userId: number,
    role: RoleCode,
    unitName: string,
    taskId: number,
    payload: CompleteTaskRequestInput,
  ): Promise<ChangeRequestCreated> {
    /** Verifica existencia de tarea y pertenencia a unidad antes de solicitar cierre. */
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

    /** Supervisor autoaprueba; estándar deja la solicitud en estado pendiente. */
    await this.autoApproveIfSupervisor(role, userId, request.id);
    return role === 'SUPERVISOR' ? { ...request, status: 'APPROVED' } : request;
  }

  /** Registra operación de eliminación (directa o solicitada). */
  async requestTaskDeletion(
    userId: number,
    role: RoleCode,
    unitName: string,
    taskId: number,
    payload: DeleteTaskRequestInput,
  ): Promise<ChangeRequestCreated> {
    /** Verifica existencia de tarea y scope de unidad antes de solicitar baja. */
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

    /** Homologa respuesta para ambos roles tras aplicar política de autoaprobación. */
    await this.autoApproveIfSupervisor(role, userId, request.id);
    return role === 'SUPERVISOR' ? { ...request, status: 'APPROVED' } : request;
  }
}
