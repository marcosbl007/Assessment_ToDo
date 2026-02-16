/**
 * - Cliente HTTP para endpoints de tareas y reportes.
 * - Centraliza llamadas autenticadas y manejo de errores de API.
 */
import type {
  CreateTaskRequestData,
  DecisionTaskRequestData,
  PendingTaskChangeRequest,
  SupervisorReportSnapshot,
  TaskItem,
  UnitUser,
  UpdateTaskRequestData,
} from '../types';
import { getSessionToken } from './auth.service';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function parseError(response: Response): Promise<never> {
  let message = 'Error inesperado en la solicitud';

  try {
    const payload = (await response.json()) as { message?: string };
    if (payload.message) {
      message = payload.message;
    }
  } catch {
    message = response.statusText || message;
  }

  throw new Error(message);
}

function getAuthHeaders(): HeadersInit {
  const token = getSessionToken();
  if (!token) {
    throw new Error('No hay sesión activa');
  }

  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function getApprovedTasksRequest(): Promise<TaskItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/tasks`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    return parseError(response);
  }

  const payload = (await response.json()) as { tasks: TaskItem[] };
  return payload.tasks;
}

export async function getPendingRequestsRequest(): Promise<PendingTaskChangeRequest[]> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/change-requests/pending`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    return parseError(response);
  }

  const payload = (await response.json()) as { requests: PendingTaskChangeRequest[] };
  return payload.requests;
}

export async function getOwnChangeRequestsRequest(
  status?: PendingTaskChangeRequest['status'],
): Promise<PendingTaskChangeRequest[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const response = await fetch(`${API_BASE_URL}/api/tasks/change-requests/mine${query}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    return parseError(response);
  }

  const payload = (await response.json()) as { requests: PendingTaskChangeRequest[] };
  return payload.requests;
}

export async function getUnitUsersRequest(): Promise<UnitUser[]> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/unit-users`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    return parseError(response);
  }

  const payload = (await response.json()) as { users: UnitUser[] };
  return payload.users;
}

export async function createTaskRequest(data: CreateTaskRequestData): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/requests/create`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return parseError(response);
  }
}

export async function updateTaskRequest(taskId: number, data: UpdateTaskRequestData): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/tasks/${taskId}/requests/update`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return parseError(response);
  }
}

export async function completeTaskRequest(taskId: number, reason?: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/tasks/${taskId}/requests/complete`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    return parseError(response);
  }
}

export async function deleteTaskRequest(taskId: number, reason?: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/tasks/${taskId}/requests/delete`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    return parseError(response);
  }
}

export async function decideTaskRequest(requestId: number, data: DecisionTaskRequestData): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/change-requests/${requestId}/decision`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return parseError(response);
  }
}

export async function getSupervisorReportsSnapshotRequest(): Promise<SupervisorReportSnapshot> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/reports/snapshot`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    return parseError(response);
  }

  const payload = (await response.json()) as { report: SupervisorReportSnapshot };
  return payload.report;
}
