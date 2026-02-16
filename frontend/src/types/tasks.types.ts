export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type ApprovalDecision = 'APPROVED' | 'REJECTED';

export interface TaskItem {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
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

export interface PendingTaskChangeRequest {
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

export interface UnitUser {
  id: number;
  name: string;
  email: string;
  role: 'STANDARD' | 'SUPERVISOR';
}

export interface CreateTaskRequestData {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  assignedToUserId?: number | null;
  reason?: string;
}

export interface UpdateTaskRequestData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  assignedToUserId?: number | null;
  reason?: string;
}

export interface DecisionTaskRequestData {
  decision: ApprovalDecision;
  reviewComment?: string;
}

export interface SupervisorReportHistoryItem {
  id: number;
  taskTitle: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'COMPLETED' | 'IN_PROGRESS' | 'REJECTED';
  endDate: string;
}

export interface SupervisorReportSnapshot {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  pendingApprovals: number;
  statusDistribution: {
    completed: number;
    inProgress: number;
    pending: number;
    rejected: number;
  };
  priorityDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  history: SupervisorReportHistoryItem[];
}
