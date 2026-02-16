export type ApprovalDecision = 'APPROVED' | 'REJECTED';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface PublicTask {
  id: number;
  title: string;
  description: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  organizationalUnitCode: string;
  organizationalUnitName: string;
  createdBy: string;
  approvedBy: string | null;
}

export interface PendingChangeRequest {
  id: number;
  taskId: number | null;
  changeType: 'CREATE' | 'UPDATE' | 'COMPLETE' | 'DELETE';
  status: 'PENDING';
  reason: string | null;
  payload: Record<string, unknown>;
  requestedAt: string;
  requestedBy: string;
  organizationalUnitCode: string;
  organizationalUnitName: string;
  currentTaskTitle: string | null;
}

export interface ChangeRequestDecisionInput {
  decision: ApprovalDecision;
  reviewComment?: string;
}

export interface ChangeRequestDecisionResult {
  changeRequestId: number;
  status: ApprovalDecision;
  taskId: number | null;
}

export interface CreateTaskRequestInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  reason?: string;
}

export interface UpdateTaskRequestInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  reason?: string;
}

export interface CompleteTaskRequestInput {
  reason?: string;
}

export interface DeleteTaskRequestInput {
  reason?: string;
}

export interface ChangeRequestCreated {
  id: number;
  changeType: 'CREATE' | 'UPDATE' | 'COMPLETE' | 'DELETE';
  status: 'PENDING';
  requestedAt: string;
}
