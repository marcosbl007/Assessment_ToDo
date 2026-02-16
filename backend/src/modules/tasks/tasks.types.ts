export type ApprovalDecision = 'APPROVED' | 'REJECTED';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
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
  assignedToUserId: number | null;
  assignedTo: string | null;
}

export interface PendingChangeRequest {
  id: number;
  taskId: number | null;
  changeType: 'CREATE' | 'UPDATE' | 'COMPLETE' | 'DELETE';
  status: ApprovalStatus;
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
  assignedToUserId?: number | null;
  reason?: string;
}

export interface UpdateTaskRequestInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  assignedToUserId?: number | null;
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
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
}

export interface UnitUser {
  id: number;
  name: string;
  email: string;
  role: 'STANDARD' | 'SUPERVISOR';
}

export interface TaskStatusDistribution {
  completed: number;
  inProgress: number;
  pending: number;
  rejected: number;
}

export interface TaskPriorityDistribution {
  high: number;
  medium: number;
  low: number;
}

export interface ReportHistoryItem {
  id: number;
  taskTitle: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
  endDate: string;
}

export interface SupervisorReportSnapshot {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  pendingApprovals: number;
  statusDistribution: TaskStatusDistribution;
  priorityDistribution: TaskPriorityDistribution;
  history: ReportHistoryItem[];
}
