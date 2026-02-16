/**
 * - Definición de rutas del módulo de tareas.
 * - Aplica autenticación y permisos RBAC por endpoint.
 */
import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { requirePermission } from '../../shared/middleware/rbac.middleware';
import { TasksController } from './tasks.controller';
import { TasksRepository } from './tasks.repository';
import { TasksService } from './tasks.service';

export const tasksRouter = Router();

const tasksRepository = new TasksRepository();
const tasksService = new TasksService(tasksRepository);
const tasksController = new TasksController(tasksService);

tasksRouter.use(authenticate);

/** Listado de tareas visibles por rol y unidad. */
tasksRouter.get('/', requirePermission('TASK_VIEW_ALL'), tasksController.listApprovedTasks);
/** Usuarios activos de la unidad para asignación/reasignación. */
tasksRouter.get('/unit-users', requirePermission('TASK_VIEW_ALL'), tasksController.listUnitUsers);
/** Solicitudes propias del usuario autenticado. */
tasksRouter.get('/change-requests/mine', requirePermission('TASK_VIEW_ALL'), tasksController.listOwnRequests);
/** Creación de tarea/s solicitud de creación según rol. */
tasksRouter.post('/requests/create', requirePermission('TASK_CREATE'), tasksController.createTaskRequest);
/** Solicitud/actualización directa de tarea existente. */
tasksRouter.post('/tasks/:taskId/requests/update', requirePermission('TASK_EDIT_UNIT'), tasksController.updateTaskRequest);
tasksRouter.post(
  '/tasks/:taskId/requests/complete',
  requirePermission('TASK_COMPLETE_UNIT'),
  tasksController.completeTaskRequest,
);
/** Solicitud/directa de eliminación de tarea. */
tasksRouter.post('/tasks/:taskId/requests/delete', requirePermission('TASK_DELETE_UNIT'), tasksController.deleteTaskRequest);
/** Cola pendiente para supervisor aprobador. */
tasksRouter.get(
  '/change-requests/pending',
  requirePermission('TASK_APPROVE_CHANGES'),
  tasksController.listPendingRequests,
);
/** Snapshot consolidado de reportes por unidad. */
tasksRouter.get('/reports/snapshot', requirePermission('TASK_VIEW_ALL'), tasksController.getSupervisorReports);
/** Decisión de aprobación/rechazo sobre solicitud. */
tasksRouter.post(
  '/change-requests/:requestId/decision',
  requirePermission('TASK_APPROVE_CHANGES'),
  tasksController.decideRequest,
);
