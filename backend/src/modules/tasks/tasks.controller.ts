/**
 * - Controlador HTTP del módulo de tareas.
 * - Traduce requests/responses y delega la lógica al servicio.
 */
import type { Request, Response } from 'express';
import { HttpError } from '../../shared/errors/HttpError';
import type { AuthenticatedRequest } from '../../shared/types/authenticated-request';
import { TasksService } from './tasks.service';
import type {
  ApprovalStatus,
  ChangeRequestDecisionInput,
  CompleteTaskRequestInput,
  CreateTaskRequestInput,
  DeleteTaskRequestInput,
  UpdateTaskRequestInput,
} from './tasks.types';

export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  /** Endpoint para crear tarea o solicitud de creación según rol autenticado. */
  createTaskRequest = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.authUser) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    try {
      const payload = req.body as CreateTaskRequestInput;
      const request = await this.tasksService.requestTaskCreation(
        authReq.authUser.id,
        authReq.authUser.role,
        authReq.authUser.unit,
        payload,
      );
      const isSupervisor = authReq.authUser.role === 'SUPERVISOR';

      res.status(201).json({
        message: isSupervisor ? 'Tarea creada correctamente.' : 'Solicitud de creación enviada para aprobación.',
        request,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /** Endpoint para registrar actualización o solicitud de cambio sobre tarea. */
  updateTaskRequest = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.authUser) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    const taskId = Number(req.params.taskId);

    try {
      const payload = req.body as UpdateTaskRequestInput;
      const request = await this.tasksService.requestTaskUpdate(
        authReq.authUser.id,
        authReq.authUser.role,
        authReq.authUser.unit,
        taskId,
        payload,
      );
      const isSupervisor = authReq.authUser.role === 'SUPERVISOR';

      res.status(201).json({
        message: isSupervisor ? 'Tarea actualizada correctamente.' : 'Solicitud de actualización enviada para aprobación.',
        request,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /** Endpoint para completar tarea o solicitar su completado. */
  completeTaskRequest = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.authUser) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    const taskId = Number(req.params.taskId);

    try {
      const payload = req.body as CompleteTaskRequestInput;
      const request = await this.tasksService.requestTaskCompletion(
        authReq.authUser.id,
        authReq.authUser.role,
        authReq.authUser.unit,
        taskId,
        payload,
      );
      const isSupervisor = authReq.authUser.role === 'SUPERVISOR';

      res.status(201).json({
        message: isSupervisor
          ? 'Tarea marcada como completada correctamente.'
          : 'Solicitud de completado enviada para aprobación.',
        request,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /** Endpoint para eliminar tarea o solicitar eliminación. */
  deleteTaskRequest = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.authUser) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    const taskId = Number(req.params.taskId);

    try {
      const payload = req.body as DeleteTaskRequestInput;
      const request = await this.tasksService.requestTaskDeletion(
        authReq.authUser.id,
        authReq.authUser.role,
        authReq.authUser.unit,
        taskId,
        payload,
      );
      const isSupervisor = authReq.authUser.role === 'SUPERVISOR';

      res.status(201).json({
        message: isSupervisor ? 'Tarea eliminada correctamente.' : 'Solicitud de eliminación enviada para aprobación.',
        request,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /** Lista tareas visibles para el usuario autenticado. */
  listApprovedTasks = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.authUser) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    try {
      const tasks = await this.tasksService.getApprovedTasks(
        authReq.authUser.unit,
        authReq.authUser.role,
        authReq.authUser.id,
      );
      res.status(200).json({ tasks });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /** Lista solicitudes del usuario autenticado con filtro opcional de estado. */
  listOwnRequests = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.authUser) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    try {
      const rawStatus = req.query.status;
      const status =
        typeof rawStatus === 'string' && rawStatus.trim().length > 0
          ? (rawStatus.trim().toUpperCase() as ApprovalStatus)
          : undefined;

      const requests = await this.tasksService.getOwnChangeRequests(authReq.authUser.id, authReq.authUser.unit, status);
      res.status(200).json({ requests });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /** Lista usuarios activos de la misma unidad organizacional. */
  listUnitUsers = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.authUser) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    try {
      const users = await this.tasksService.getUnitUsers(authReq.authUser.unit);
      res.status(200).json({ users });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /** Lista solicitudes pendientes para revisión de supervisor. */
  listPendingRequests = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.authUser) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    try {
      const requests = await this.tasksService.getPendingRequestsForSupervisor(
        authReq.authUser.unit,
        authReq.authUser.role,
      );

      res.status(200).json({ requests });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /** Obtiene snapshot de métricas e historial para reportes del supervisor. */
  getSupervisorReports = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.authUser) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    try {
      const report = await this.tasksService.getSupervisorReportSnapshot(authReq.authUser.unit);
      res.status(200).json({ report });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /** Aplica decisión APPROVED/REJECTED sobre solicitud pendiente. */
  decideRequest = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.authUser) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    const requestId = Number(req.params.requestId);

    try {
      const payload = req.body as ChangeRequestDecisionInput;

      const result = await this.tasksService.decidePendingRequest(
        authReq.authUser.id,
        authReq.authUser.role,
        requestId,
        payload,
      );

      res.status(200).json({
        message: `Solicitud ${result.status === 'APPROVED' ? 'aprobada' : 'rechazada'} correctamente.`,
        result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /** Mapea errores controlados/no controlados a respuesta HTTP estándar. */
  private handleError(error: unknown, res: Response): void {
    if (error instanceof HttpError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    console.error('Error en tasks:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}
