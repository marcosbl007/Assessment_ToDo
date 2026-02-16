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

tasksRouter.get('/', requirePermission('TASK_VIEW_ALL'), tasksController.listApprovedTasks);
tasksRouter.get('/unit-users', requirePermission('TASK_VIEW_ALL'), tasksController.listUnitUsers);
tasksRouter.post('/requests/create', requirePermission('TASK_CREATE'), tasksController.createTaskRequest);
tasksRouter.post('/tasks/:taskId/requests/update', requirePermission('TASK_EDIT_UNIT'), tasksController.updateTaskRequest);
tasksRouter.post(
  '/tasks/:taskId/requests/complete',
  requirePermission('TASK_COMPLETE_UNIT'),
  tasksController.completeTaskRequest,
);
tasksRouter.post('/tasks/:taskId/requests/delete', requirePermission('TASK_DELETE_UNIT'), tasksController.deleteTaskRequest);
tasksRouter.get(
  '/change-requests/pending',
  requirePermission('TASK_APPROVE_CHANGES'),
  tasksController.listPendingRequests,
);
tasksRouter.post(
  '/change-requests/:requestId/decision',
  requirePermission('TASK_APPROVE_CHANGES'),
  tasksController.decideRequest,
);
