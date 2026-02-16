/**
 * - Página principal del usuario estándar.
 * - Gestiona dashboard general, temporal y notificaciones del usuario.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaBell } from 'react-icons/fa';
import { FaPowerOff } from 'react-icons/fa';
import { FaCheckCircle, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import { Logo } from '../../components/atoms';
import {
  completeTaskRequest,
  deleteTaskRequest,
  getApprovedTasksRequest,
  getOwnChangeRequestsRequest,
  getUnitUsersRequest,
  updateTaskRequest,
} from '../../services';
import type { PendingTaskChangeRequest, TaskItem, UnitUser, User } from '../../types';
import { SupervisorFiltersBar } from '../supervisor/components/molecules/SupervisorFiltersBar';
import { SupervisorDashboardHomePage } from '../supervisor/pages/SupervisorDashboardHomePage';
import { SupervisorTemporalPage } from '../supervisor/pages/SupervisorTemporalPage';
import type { TaskSortBy } from '../supervisor/types';

interface StandardDashboardPageProps {
  user: User;
  onLogout: () => void;
}

interface StandardNotificationItem {
  id: number;
  title: string;
  task: string;
  priority: string;
  assignedBy: string;
  receivedAt: string;
  unread: boolean;
  sortTime: number;
}

const requestTypeLabelMap: Record<PendingTaskChangeRequest['changeType'], string> = {
  CREATE: 'creación',
  UPDATE: 'actualización',
  COMPLETE: 'completado',
  DELETE: 'eliminación',
};

const priorityLabelMap: Record<TaskItem['priority'], string> = {
  HIGH: 'Alta',
  MEDIUM: 'Media',
  LOW: 'Baja',
};

const formatRelativeTime = (value: string): string => {
  const target = new Date(value).getTime();
  if (Number.isNaN(target)) {
    return 'Reciente';
  }

  const diffMs = Date.now() - target;
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) {
    return `Hace ${diffMinutes} min`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `Hace ${diffHours} h`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return 'Ayer';
  }

  return `Hace ${diffDays} días`;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'No se pudo completar la operación.';
};

export const StandardDashboardPage = ({ user, onLogout }: StandardDashboardPageProps) => {
  const [activeBoard, setActiveBoard] = useState<'general' | 'temporal'>('general');
  const [searchText, setSearchText] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<TaskItem['priority'] | null>(null);
  const [sortBy, setSortBy] = useState<TaskSortBy>('new');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [unitUsers, setUnitUsers] = useState<UnitUser[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingTaskChangeRequest[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<Record<number, string>>({});
  const [selectedDueDates, setSelectedDueDates] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  const loadDashboardData = useCallback(async (showLoading: boolean) => {
    if (showLoading) {
      setIsLoading(true);
    }

    try {
      setLoadError(null);
      const [apiTasks, apiUnitUsers, apiRequests] = await Promise.all([
        getApprovedTasksRequest(),
        getUnitUsersRequest(),
        getOwnChangeRequestsRequest(),
      ]);

      setTasks(apiTasks);
      setUnitUsers(apiUnitUsers);
      setPendingRequests(apiRequests);
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadDashboardData(true);

    const intervalId = window.setInterval(() => {
      void loadDashboardData(false);
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [loadDashboardData]);

  const notifications = useMemo(() => {
    const taskNotifications: StandardNotificationItem[] = tasks.map((task) => {
      const sortTime = new Date(task.createdAt).getTime();
      const isRecent = Date.now() - sortTime < 24 * 60 * 60 * 1000;

      return {
        id: Number(`1${task.id}`),
        title: 'Nueva tarea asignada',
        task: task.title,
        priority: priorityLabelMap[task.priority],
        assignedBy: task.createdBy,
        receivedAt: formatRelativeTime(task.createdAt),
        unread: isRecent,
        sortTime,
      };
    });

    const requestNotifications: StandardNotificationItem[] = pendingRequests.map((request) => {
      const sortTime = new Date(request.requestedAt).getTime();
      const title =
        request.status === 'PENDING'
          ? `Solicitud de ${requestTypeLabelMap[request.changeType]} en revisión`
          : request.status === 'APPROVED'
            ? `Solicitud de ${requestTypeLabelMap[request.changeType]} aprobada`
            : `Solicitud de ${requestTypeLabelMap[request.changeType]} rechazada`;

      return {
        id: Number(`2${request.id}`),
        title,
        task: request.currentTaskTitle ?? `Solicitud #${request.id}`,
        priority:
          request.changeType === 'DELETE' || request.changeType === 'COMPLETE'
            ? 'Alta'
            : request.changeType === 'UPDATE'
              ? 'Media'
              : 'Baja',
        assignedBy: request.requestedBy,
        receivedAt: formatRelativeTime(request.requestedAt),
        unread: request.status === 'PENDING',
        sortTime,
      };
    });

    return [...taskNotifications, ...requestNotifications]
      .sort((first, second) => second.sortTime - first.sortTime)
      .slice(0, 8);
  }, [tasks, pendingRequests]);

  const unreadNotifications = notifications.filter((notification) => notification.unread).length;

  useEffect(() => {
    if (!isNotificationsOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!notificationsRef.current) {
        return;
      }

      if (event.target instanceof Node && notificationsRef.current.contains(event.target)) {
        return;
      }

      setIsNotificationsOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNotificationsOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isNotificationsOpen]);

  const handlePriorityFilter = (priority: TaskItem['priority']) => {
    setPriorityFilter((current) => (current === priority ? null : priority));
  };

  const temporalTaskIds = useMemo(() => {
    return new Set(
      pendingRequests
        .filter((request) => (request.status === 'PENDING' || request.status === 'APPROVED') && request.taskId !== null)
        .map((request) => request.taskId as number),
    );
  }, [pendingRequests]);

  const filteredTasks = useMemo(() => {
    const normalized = searchText.trim().toLowerCase();

    const base = tasks.filter((task) => {
      if (temporalTaskIds.has(task.id)) {
        return false;
      }

      const matchesSearch =
        !normalized ||
        String(task.id).includes(normalized) ||
        task.title.toLowerCase().includes(normalized) ||
        (task.description ?? '').toLowerCase().includes(normalized);

      const matchesPriority = !priorityFilter || task.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });

    const sorted = [...base];

    if (sortBy === 'new') {
      sorted.sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime());
    } else if (sortBy === 'old') {
      sorted.sort((first, second) => new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime());
    } else if (sortBy === 'alphabetical') {
      sorted.sort((first, second) => first.title.localeCompare(second.title, 'es', { sensitivity: 'base' }));
    } else {
      sorted.sort((first, second) => first.id - second.id);
    }

    return sorted;
  }, [tasks, searchText, priorityFilter, sortBy, temporalTaskIds]);

  const filteredPendingRequests = useMemo(() => {
    const normalized = searchText.trim().toLowerCase();

    const mapRequestPriority = (request: PendingTaskChangeRequest): TaskItem['priority'] => {
      if (request.changeType === 'DELETE' || request.changeType === 'COMPLETE') {
        return 'HIGH';
      }

      if (request.changeType === 'UPDATE') {
        return 'MEDIUM';
      }

      return 'LOW';
    };

    const base = pendingRequests.filter((request) => {
      const title = (request.currentTaskTitle ?? '').toLowerCase();
      const requester = request.requestedBy.toLowerCase();
      const reason = (request.reason ?? '').toLowerCase();

      const matchesSearch =
        !normalized ||
        String(request.id).includes(normalized) ||
        title.includes(normalized) ||
        requester.includes(normalized) ||
        reason.includes(normalized);

      const mappedPriority = mapRequestPriority(request);
      const matchesPriority = !priorityFilter || mappedPriority === priorityFilter;

      return matchesSearch && matchesPriority;
    });

    const sorted = [...base];

    if (sortBy === 'new') {
      sorted.sort((first, second) => new Date(second.requestedAt).getTime() - new Date(first.requestedAt).getTime());
    } else if (sortBy === 'old') {
      sorted.sort((first, second) => new Date(first.requestedAt).getTime() - new Date(second.requestedAt).getTime());
    } else if (sortBy === 'alphabetical') {
      sorted.sort((first, second) => {
        const firstLabel = first.currentTaskTitle ?? first.requestedBy;
        const secondLabel = second.currentTaskTitle ?? second.requestedBy;
        return firstLabel.localeCompare(secondLabel, 'es', { sensitivity: 'base' });
      });
    } else {
      sorted.sort((first, second) => first.id - second.id);
    }

    return sorted;
  }, [pendingRequests, searchText, priorityFilter, sortBy]);

  const pendingOnlyRequests = useMemo(
    () => filteredPendingRequests.filter((request) => request.status === 'PENDING'),
    [filteredPendingRequests],
  );

  const handleAssignTask = useCallback(
    async (taskId: number) => {
      const selectedAssignee = selectedAssignees[taskId];
      const assigneeId = Number(selectedAssignee);
      const selectedDueDate = selectedDueDates[taskId];
      const task = tasks.find((currentTask) => currentTask.id === taskId);
      const currentDueDate = task?.dueDate ? task.dueDate.slice(0, 10) : '';
      const hasDueDateChange = selectedDueDate !== undefined && selectedDueDate !== currentDueDate;
      const hasAssigneeChange = !!selectedAssignee && Number.isInteger(assigneeId) && assigneeId > 0;

      if (!hasAssigneeChange && !hasDueDateChange) {
        setFeedback('Realiza un cambio de fecha objetivo o reasignación antes de solicitar aprobación.');
        return;
      }

      try {
        await updateTaskRequest(taskId, {
          ...(hasAssigneeChange ? { assignedToUserId: assigneeId } : {}),
          ...(hasDueDateChange ? { dueDate: selectedDueDate || undefined } : {}),
          reason: 'Solicitud de actualización enviada por usuario estándar.',
        });

        setFeedback(`Solicitud de actualización enviada para tarea #${taskId}.`);
        setSelectedAssignees((state) => {
          const nextState = { ...state };
          delete nextState[taskId];
          return nextState;
        });
        setSelectedDueDates((state) => {
          const nextState = { ...state };
          delete nextState[taskId];
          return nextState;
        });
        await loadDashboardData(false);
      } catch (error) {
        setFeedback(getErrorMessage(error));
      }
    },
    [selectedAssignees, selectedDueDates, tasks, loadDashboardData],
  );

  const handleCompleteTask = useCallback(
    async (taskId: number) => {
      try {
        await completeTaskRequest(taskId, 'Solicitud de completado enviada por usuario estándar.');
        setFeedback(`Solicitud de completado enviada para tarea #${taskId}.`);
        await loadDashboardData(false);
      } catch (error) {
        setFeedback(getErrorMessage(error));
      }
    },
    [loadDashboardData],
  );

  const handleDeleteTask = useCallback(
    async (taskId: number) => {
      try {
        await deleteTaskRequest(taskId, 'Solicitud de eliminación enviada por usuario estándar.');
        setFeedback(`Solicitud de eliminación enviada para tarea #${taskId}.`);
        await loadDashboardData(false);
      } catch (error) {
        setFeedback(getErrorMessage(error));
      }
    },
    [loadDashboardData],
  );

  return (
    <main className="flex min-h-screen flex-col bg-[var(--fondo)] text-[var(--blanco)]">
      <section className="px-2 pt-0 sm:px-5">
        <header className="relative z-20 -mx-2 mb-0 overflow-visible px-2 py-2 sm:-mx-5 sm:px-5 sm:py-3">
          <div
            className="pointer-events-none absolute top-0 left-0 h-32 w-full"
            style={{
              background:
                'linear-gradient(to bottom, rgba(222, 222, 224, 0.02) 0%, rgba(222, 222, 224, 0.04) 18%, rgba(222, 222, 224, 0.02) 42%, transparent 100%)',
            }}
          />

          <div className="relative z-10 flex flex-col items-start justify-between gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <Logo size="sm" className="shrink-0" />
              <h1 className="min-w-0 max-w-full whitespace-normal break-words text-[10px] font-semibold uppercase leading-tight tracking-[0.06em] text-[var(--blanco)] sm:text-xs md:text-lg lg:text-xl">
                Bienvenido {user.username} - {user.unit}
              </h1>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="relative" ref={notificationsRef}>
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen((current) => !current)}
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--blanco)]/90 hover:text-[var(--blanco)]"
                  aria-label="Notificaciones"
                  title="Notificaciones"
                  aria-expanded={isNotificationsOpen}
                >
                  <FaBell />
                  {unreadNotifications > 0 && (
                    <>
                      <span className="absolute top-[7px] right-[8px] h-2 w-2 rounded-full bg-[var(--dorado)]" />
                      <span className="absolute -top-1 -right-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full border border-[var(--fondo)] bg-[var(--dorado)] px-1 text-[10px] font-semibold text-[var(--fondo)]">
                        {unreadNotifications}
                      </span>
                    </>
                  )}
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 top-[calc(100%+10px)] z-30 w-[22rem] max-w-[calc(100vw-1.5rem)] rounded-md bg-[var(--fondo)] shadow-2xl">
                    <span className="pointer-events-none absolute -top-2 right-3 h-4 w-4 rotate-45 bg-[var(--fondo)]" />

                    <div className="flex items-center justify-between border-b border-[var(--blanco)]/10 px-4 py-3">
                      <h2 className="text-sm font-semibold tracking-[0.02em] text-[var(--blanco)]">Notificaciones</h2>
                      <span className="rounded-full border border-[var(--dorado)]/40 bg-[var(--dorado)]/15 px-2 py-0.5 text-xs font-medium text-[var(--blanco)]">
                        {notifications.length}
                      </span>
                    </div>

                    <div className="max-h-[20rem] overflow-y-auto px-2 py-2">
                      {notifications.map((notification, index) => (
                        <article
                          key={notification.id}
                          className="relative mb-1 rounded-md px-2 py-2 transition-colors hover:bg-[var(--blanco)]/[0.03]"
                        >
                          <div className="flex items-start gap-2">
                            <span className="mt-1 h-2 w-2 rounded-full bg-[var(--dorado)]" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-xs font-semibold text-[var(--blanco)]">{notification.title}</p>
                                {notification.unread && (
                                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--dorado)]">
                                    Nuevo
                                  </span>
                                )}
                              </div>

                              <p className="mt-0.5 truncate text-xs text-[var(--blanco)]/85">{notification.task}</p>
                              <p className="mt-1 text-[11px] text-[var(--blanco)]/65">
                                Prioridad {notification.priority} • {notification.assignedBy}
                              </p>
                              <p className="mt-0.5 text-[11px] text-[var(--blanco)]/55">{notification.receivedAt}</p>
                            </div>
                          </div>

                          {index < notifications.length - 1 && (
                            <span
                              className="pointer-events-none absolute bottom-0 left-2 right-2 h-px"
                              style={{
                                background:
                                  'linear-gradient(to right, transparent 0%, rgba(157, 131, 62, 0.75) 20%, rgba(157, 131, 62, 0.75) 80%, transparent 100%)',
                              }}
                            />
                          )}
                        </article>
                      ))}

                      {notifications.length === 0 && (
                        <p className="px-2 py-3 text-xs text-[var(--blanco)]/65">No hay notificaciones por ahora.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--dorado)] text-[var(--blanco)]"
                title="Logout"
                aria-label="Logout"
              >
                <FaPowerOff />
              </button>
            </div>
          </div>

          <span className="pointer-events-none absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[var(--dorado)] to-transparent sm:left-8 sm:right-8" />
        </header>
      </section>

      <section className="relative flex-1 overflow-hidden px-2 pb-2 pt-0 sm:px-5 sm:pb-3 sm:pt-0">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute -top-8 left-1/2 h-[32rem] w-[80%] -translate-x-1/2 blur-3xl"
            style={{
              background:
                'radial-gradient(circle, rgba(157, 131, 62, 0.12) 0%, rgba(157, 131, 62, 0.06) 35%, rgba(157, 131, 62, 0.03) 55%, transparent 78%)',
            }}
          />
          <div
            className="absolute inset-x-0 top-0 h-[65vh]"
            style={{
              background:
                'linear-gradient(to bottom, rgba(222, 222, 224, 0.03) 0%, rgba(157, 131, 62, 0.04) 28%, rgba(21, 22, 27, 0) 100%)',
            }}
          />
        </div>

        <div className="relative z-10 pt-3 sm:pt-4">
          {(feedback || loadError) && (
            <div className="pointer-events-none fixed right-5 top-24 z-[120]">
              <div
                className={`pointer-events-auto flex max-w-[420px] items-start gap-3 rounded-xl border px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur-sm ${
                  loadError
                    ? 'border-[#E77F72]/45 bg-[#2D1D1D]/90 text-[#FECACA]'
                    : 'border-[var(--dorado)]/45 bg-[#15161B]/95 text-[var(--blanco)]'
                }`}
              >
                <span
                  className={`mt-0.5 text-base ${loadError ? 'text-[#E77F72]' : 'text-[var(--dorado)]'}`}
                  aria-hidden="true"
                >
                  {loadError ? <FaExclamationTriangle /> : <FaCheckCircle />}
                </span>

                <div className="min-w-0 flex-1 text-sm leading-relaxed">{loadError ?? feedback}</div>

                <button
                  type="button"
                  onClick={() => {
                    setFeedback(null);
                    setLoadError(null);
                  }}
                  className="text-[var(--blanco)]/65 transition hover:text-[var(--blanco)]"
                  aria-label="Cerrar mensaje"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
          )}

          <SupervisorFiltersBar
            searchText={searchText}
            onSearchTextChange={setSearchText}
            priorityFilter={priorityFilter}
            onPriorityFilterChange={handlePriorityFilter}
            sortBy={sortBy}
            onSortByChange={setSortBy}
          />

          <div className="mb-3 flex items-center gap-5 border-b border-white/10 pb-1">
            <button
              type="button"
              onClick={() => setActiveBoard('general')}
              className={`relative pb-2 text-xs font-semibold sm:text-sm ${
                activeBoard === 'general' ? 'text-[var(--blanco)]' : 'text-[var(--blanco)]/60'
              }`}
            >
              Dashboard general
              {activeBoard === 'general' && (
                <span className="pointer-events-none absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--dorado)]" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveBoard('temporal')}
              className={`relative pb-2 text-xs font-semibold sm:text-sm ${
                activeBoard === 'temporal' ? 'text-[var(--blanco)]' : 'text-[var(--blanco)]/60'
              }`}
            >
              Dashboard temporal
              {activeBoard === 'temporal' && (
                <span className="pointer-events-none absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--dorado)]" />
              )}
            </button>
          </div>

          {isLoading ? (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-[var(--blanco)]/75">
              Cargando información del dashboard...
            </div>
          ) : (
            <>
              {activeBoard === 'general' && (
                <SupervisorDashboardHomePage
                  tasks={filteredTasks}
                  selectedAssignees={selectedAssignees}
                  selectedDueDates={selectedDueDates}
                  unitUsers={unitUsers}
                  isRequestMode
                  onAssigneeChange={(taskId, userId) =>
                    setSelectedAssignees((state) => ({
                      ...state,
                      [taskId]: userId,
                    }))
                  }
                  onDueDateChange={(taskId, dueDate) =>
                    setSelectedDueDates((state) => ({
                      ...state,
                      [taskId]: dueDate,
                    }))
                  }
                  onAssignTask={handleAssignTask}
                  onCompleteTask={handleCompleteTask}
                  onDeleteTask={handleDeleteTask}
                />
              )}

              {activeBoard === 'temporal' && <SupervisorTemporalPage pendingRequests={pendingOnlyRequests} readOnly />}
            </>
          )}
        </div>
      </section>
    </main>
  );
};
