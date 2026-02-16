import type { Request, Response } from 'express';
import { HttpError } from '../../shared/errors/HttpError';
import type { AuthenticatedRequest } from '../../shared/types/authenticated-request';
import { TasksService } from './tasks.service';
import type {
  ChangeRequestDecisionInput,
  CompleteTaskRequestInput,
  CreateTaskRequestInput,
  DeleteTaskRequestInput,
  UpdateTaskRequestInput,
} from './tasks.types';

export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  createTaskRequest = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.authUser) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    try {
      const payload = req.body as CreateTaskRequestInput;
      const request = await this.tasksService.requestTaskCreation(authReq.authUser.id, authReq.authUser.unit, payload);

      res.status(201).json({
        message: 'Solicitud de creación enviada para aprobación.',
        request,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  updateTaskRequest = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.authUser) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    const taskId = Number(req.params.taskId);

    try {
      const payload = req.body as UpdateTaskRequestInput;
      const request = await this.tasksService.requestTaskUpdate(authReq.authUser.id, authReq.authUser.unit, taskId, payload);

      res.status(201).json({
        message: 'Solicitud de actualización enviada para aprobación.',
        request,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

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
        authReq.authUser.unit,
        taskId,
        payload,
      );

      res.status(201).json({
        message: 'Solicitud de completado enviada para aprobación.',
        request,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

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
        authReq.authUser.unit,
        taskId,
        payload,
      );

      res.status(201).json({
        message: 'Solicitud de eliminación enviada para aprobación.',
        request,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  listApprovedTasks = async (_req: Request, res: Response): Promise<void> => {
    try {
      const tasks = await this.tasksService.getApprovedTasks();
      res.status(200).json({ tasks });
    } catch (error) {
      this.handleError(error, res);
    }
  };

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

  private handleError(error: unknown, res: Response): void {
    if (error instanceof HttpError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    console.error('Error en tasks:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}
