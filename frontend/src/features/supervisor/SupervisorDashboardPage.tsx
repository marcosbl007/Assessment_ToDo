/**
 * - Página principal del supervisor.
 * - Orquesta tareas, temporal, reportes, notificaciones y configuración.
 */
import { useEffect, useMemo, useState } from 'react';
import { FaCheckCircle, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import {
  completeTaskRequest,
  createTaskRequest,
  decideTaskRequest,
  deleteTaskRequest,
  getApprovedTasksRequest,
  getPendingRequestsRequest,
  getSupervisorReportsSnapshotRequest,
  getUnitUsersRequest,
  updatePasswordRequest,
  updateProfileRequest,
  updateTaskRequest,
} from '../../services';
import type { PendingTaskChangeRequest, SupervisorReportSnapshot, TaskItem, UnitUser, User } from '../../types';
import { SupervisorFiltersBar } from './components/molecules/SupervisorFiltersBar';
import { SupervisorSectionHeader } from './components/molecules/SupervisorSectionHeader';
import { NewTaskModal } from './components/organisms/NewTaskModal';
import { SupervisorSidebar } from './components/organisms/SupervisorSidebar';
import { SupervisorDashboardHomePage } from './pages/SupervisorDashboardHomePage';
import { SupervisorNotificationsPage } from './pages/SupervisorNotificationsPage';
import { SupervisorReportsPage } from './pages/SupervisorReportsPage';
import { SupervisorSettingsPage } from './pages/SupervisorSettingsPage';
import { SupervisorTemporalPage } from './pages/SupervisorTemporalPage';
import type { SupervisorProfileForm, SupervisorSection, TaskCreationForm, TaskSortBy } from './types';
import { changeTypeLabelMap, formatDate } from './utils';

interface SupervisorDashboardPageProps {
  user: User;
  onLogout: () => void;
}

export const SupervisorDashboardPage = ({ user, onLogout }: SupervisorDashboardPageProps) => {
  const initialReportData: SupervisorReportSnapshot = {
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    pendingApprovals: 0,
    statusDistribution: {
      completed: 0,
      inProgress: 0,
      pending: 0,
      rejected: 0,
    },
    priorityDistribution: {
      high: 0,
      medium: 0,
      low: 0,
    },
    history: [],
  };

  const roleLabel = user.role === 'SUPERVISOR' ? 'Supervisor' : 'Usuario';
  const [activeSection, setActiveSection] = useState<SupervisorSection>('dashboard');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingTaskChangeRequest[]>([]);
  const [unitUsers, setUnitUsers] = useState<UnitUser[]>([]);
  const [reportData, setReportData] = useState<SupervisorReportSnapshot>(initialReportData);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<TaskItem['priority'] | null>(null);
  const [sortBy, setSortBy] = useState<TaskSortBy>('new');
  const [selectedAssignees, setSelectedAssignees] = useState<Record<number, string>>({});
  const [selectedDueDates, setSelectedDueDates] = useState<Record<number, string>>({});
  const [creationForm, setCreationForm] = useState<TaskCreationForm>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    assignedToUserId: '',
  });
  const [profileForm, setProfileForm] = useState<SupervisorProfileForm>({
    nombre: user.username,
    correo: user.email,
    unidad: user.unit,
  });

  const currentUserId = Number(user.id);
  const hasValidCurrentUserId = Number.isInteger(currentUserId) && currentUserId > 0;

  const notifications = useMemo(
    () => {
      const pendingNotifications = pendingRequests.map((request) => {
        const sortTime = new Date(request.requestedAt).getTime();
        return {
          id: request.id,
          title: `Solicitud ${changeTypeLabelMap[request.changeType]} pendiente`,
          detail: `${request.requestedBy} solicitó revisión para ${request.currentTaskTitle ?? 'nueva tarea'}`,
          date: formatDate(request.requestedAt),
          sortTime: Number.isNaN(sortTime) ? 0 : sortTime,
        };
      });

      const assignedTaskNotifications = tasks
        .filter((task) => {
          if (!hasValidCurrentUserId) {
            return false;
          }

          const assignedUserId = Number(task.assignedToUserId);
          return Number.isInteger(assignedUserId) && assignedUserId === currentUserId;
        })
        .map((task) => {
          const sortTime = new Date(task.createdAt).getTime();
          return {
            id: Number(`9${task.id}`),
            title: 'Nueva tarea asignada',
            detail: `${task.createdBy} te asignó la tarea ${task.title}`,
            date: formatDate(task.createdAt),
            sortTime: Number.isNaN(sortTime) ? 0 : sortTime,
          };
        });

      return [...assignedTaskNotifications, ...pendingNotifications]
        .sort((first, second) => second.sortTime - first.sortTime)
        .map(({ sortTime: _sortTime, ...notification }) => notification)
        .slice(0, 20);
    },
    [pendingRequests, tasks, hasValidCurrentUserId, currentUserId],
  );

  const filteredTasks = useMemo(() => {
    const normalized = searchText.trim().toLowerCase();

    const base = tasks.filter((task) => {
      if (task.status === 'COMPLETED') {
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
  }, [tasks, searchText, priorityFilter, sortBy]);

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

  const loadSupervisorData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [approvedTasks, pending, users, reports] = await Promise.all([
        getApprovedTasksRequest(),
        getPendingRequestsRequest(),
        getUnitUsersRequest(),
        getSupervisorReportsSnapshotRequest(),
      ]);

      setTasks(approvedTasks);
      setPendingRequests(pending);
      setUnitUsers(users);
      setReportData(reports);
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la información del supervisor.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSupervisorData();

    const polling = setInterval(() => {
      void loadSupervisorData();
    }, 25000);

    return () => {
      clearInterval(polling);
    };
  }, []);

  const handleCreateTaskRequest = async () => {
    if (!creationForm.assignedToUserId) {
      setError('Selecciona un usuario para asignar la tarea.');
      return;
    }

    setError(null);
    setFeedback(null);

    try {
      await createTaskRequest({
        title: creationForm.title,
        description: creationForm.description,
        priority: creationForm.priority,
        dueDate: creationForm.dueDate || undefined,
        assignedToUserId: Number(creationForm.assignedToUserId),
        reason: `Creación directa por supervisor para asignar a usuario ${creationForm.assignedToUserId}`,
      });

      setFeedback('Tarea creada correctamente.');
      setCreationForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assignedToUserId: '' });
      setIsCreatingTask(false);
      await loadSupervisorData();
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo crear la tarea.');
    }
  };

  const handleAssignTask = async (taskId: number) => {
    const selectedUser = selectedAssignees[taskId];
    const selectedDueDate = selectedDueDates[taskId];
    const task = tasks.find((currentTask) => currentTask.id === taskId);

    const currentAssignee = task?.assignedToUserId != null ? Number(task.assignedToUserId) : null;
    const nextAssignee = selectedUser ? Number(selectedUser) : null;
    const currentDueDate = task?.dueDate ? task.dueDate.slice(0, 10) : '';
    const hasAssigneeChange = selectedUser && Number.isInteger(nextAssignee) && nextAssignee !== currentAssignee;
    const hasDueDateChange = selectedDueDate !== undefined && selectedDueDate !== currentDueDate;

    if (!hasAssigneeChange && !hasDueDateChange) {
      setError('Realiza al menos un cambio en fecha objetivo o reasignación.');
      return;
    }

    setError(null);
    setFeedback(null);

    try {
      await updateTaskRequest(taskId, {
        ...(hasAssigneeChange ? { assignedToUserId: Number(selectedUser) } : {}),
        ...(hasDueDateChange ? { dueDate: selectedDueDate || undefined } : {}),
        reason: 'Actualización directa por supervisor',
      });

      setFeedback('Tarea actualizada correctamente.');
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
      await loadSupervisorData();
    } catch (assignError: unknown) {
      setError(assignError instanceof Error ? assignError.message : 'No se pudo actualizar la tarea.');
    }
  };

  const handleCompleteTask = async (taskId: number) => {
    setError(null);
    setFeedback(null);

    try {
      await completeTaskRequest(taskId, 'Completado directo por supervisor');
      setFeedback('Tarea marcada como completada correctamente.');
      await loadSupervisorData();
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo completar la tarea.');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    setError(null);
    setFeedback(null);

    try {
      await deleteTaskRequest(taskId, 'Eliminación directa por supervisor');
      setFeedback('Tarea eliminada correctamente.');
      await loadSupervisorData();
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo eliminar la tarea.');
    }
  };

  const handleDecision = async (requestId: number, decision: 'APPROVED' | 'REJECTED') => {
    setError(null);
    setFeedback(null);

    try {
      await decideTaskRequest(requestId, {
        decision,
        reviewComment:
          decision === 'APPROVED' ? 'Aprobado por supervisor desde dashboard temporal.' : 'Rechazado por supervisor.',
      });

      setFeedback(decision === 'APPROVED' ? 'Solicitud aprobada correctamente.' : 'Solicitud rechazada correctamente.');
      await loadSupervisorData();
    } catch (decisionError: unknown) {
      setError(decisionError instanceof Error ? decisionError.message : 'No se pudo procesar la decisión.');
    }
  };

  const handleProfileSave = async (nextProfile: SupervisorProfileForm) => {
    setError(null);
    setFeedback(null);

    const updatedUser = await updateProfileRequest({
      name: nextProfile.nombre,
      email: nextProfile.correo,
    });

    setProfileForm({
      nombre: updatedUser.username,
      correo: updatedUser.email,
      unidad: updatedUser.unit,
    });
    setFeedback('Perfil actualizado correctamente.');
  };

  const handlePasswordUpdate = async (newPassword: string) => {
    setError(null);
    setFeedback(null);

    await updatePasswordRequest({ newPassword });
    setFeedback('Contraseña actualizada correctamente.');
  };

  const handlePriorityFilter = (priority: TaskItem['priority']) => {
    setPriorityFilter((current) => (current === priority ? null : priority));
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--fondo)] text-[var(--blanco)]">
      <div className="min-h-screen w-full overflow-x-hidden">
        <SupervisorSidebar
          activeSection={activeSection}
          pendingCount={notifications.length}
          onSectionChange={setActiveSection}
          onLogout={onLogout}
        />

        <section className="min-w-0 pl-[76px]">
          <div className="relative min-h-screen w-full overflow-x-hidden overflow-y-auto rounded-none bg-[#15161B] px-2 pb-5 pt-0 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] sm:px-5">
            <div
              className="pointer-events-none absolute top-0 left-0 h-32 w-full"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(222, 222, 224, 0.02) 0%, rgba(222, 222, 224, 0.04) 18%, rgba(222, 222, 224, 0.02) 42%, transparent 100%)',
              }}
            />

            <div className="relative z-10">
              <SupervisorSectionHeader
                activeSection={activeSection}
                username={user.username}
                roleLabel={roleLabel}
                unit={user.unit}
                onCreateTask={() => setIsCreatingTask(true)}
              />

              {(activeSection === 'dashboard' || activeSection === 'temporal') && (
                <SupervisorFiltersBar
                  searchText={searchText}
                  onSearchTextChange={setSearchText}
                  priorityFilter={priorityFilter}
                  onPriorityFilterChange={handlePriorityFilter}
                  sortBy={sortBy}
                  onSortByChange={setSortBy}
                />
              )}

              {(feedback || error) && (
                <div className="pointer-events-none fixed right-5 top-24 z-[120]">
                  <div
                    className={`pointer-events-auto flex max-w-[420px] items-start gap-3 rounded-xl border px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur-sm ${
                      error
                        ? 'border-[#E77F72]/45 bg-[#2D1D1D]/90 text-[#FECACA]'
                        : 'border-[var(--dorado)]/45 bg-[#15161B]/95 text-[var(--blanco)]'
                    }`}
                  >
                    <span
                      className={`mt-0.5 text-base ${error ? 'text-[#E77F72]' : 'text-[var(--dorado)]'}`}
                      aria-hidden="true"
                    >
                      {error ? <FaExclamationTriangle /> : <FaCheckCircle />}
                    </span>

                    <div className="min-w-0 flex-1 text-sm leading-relaxed">{error ?? feedback}</div>

                    <button
                      type="button"
                      onClick={() => {
                        setFeedback(null);
                        setError(null);
                      }}
                      className="text-[var(--blanco)]/65 transition hover:text-[var(--blanco)]"
                      aria-label="Cerrar mensaje"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>
              )}

              {isLoading ? (
                <p className="text-sm text-[var(--blanco)]/70">Cargando información...</p>
              ) : (
                <>
                  {activeSection === 'dashboard' && (
                    <SupervisorDashboardHomePage
                      tasks={filteredTasks}
                      selectedAssignees={selectedAssignees}
                      selectedDueDates={selectedDueDates}
                      unitUsers={unitUsers}
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
                      onAssignTask={(taskId) => void handleAssignTask(taskId)}
                      onCompleteTask={(taskId) => void handleCompleteTask(taskId)}
                      onDeleteTask={(taskId) => void handleDeleteTask(taskId)}
                    />
                  )}

                  {activeSection === 'temporal' && (
                    <SupervisorTemporalPage
                      pendingRequests={filteredPendingRequests}
                      onDecision={(requestId, decision) => void handleDecision(requestId, decision)}
                    />
                  )}

                  {activeSection === 'reportes' && <SupervisorReportsPage reportData={reportData} />}

                  {activeSection === 'notificaciones' && (
                    <SupervisorNotificationsPage notifications={notifications} />
                  )}

                  {activeSection === 'configuracion' && (
                    <SupervisorSettingsPage
                      profileForm={profileForm}
                      onProfileFormChange={setProfileForm}
                      onSave={handleProfileSave}
                      onPasswordUpdate={handlePasswordUpdate}
                    />
                  )}
                </>
              )}

              <NewTaskModal
                isOpen={isCreatingTask}
                creationForm={creationForm}
                unitUsers={unitUsers}
                onClose={() => setIsCreatingTask(false)}
                onSubmit={() => void handleCreateTaskRequest()}
                onChange={setCreationForm}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};
