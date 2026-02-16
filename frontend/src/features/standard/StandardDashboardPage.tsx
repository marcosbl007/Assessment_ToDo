import { useMemo, useState } from 'react';
import { FaBell } from 'react-icons/fa';
import { FaPowerOff } from 'react-icons/fa';
import { Logo } from '../../components/atoms';
import type { PendingTaskChangeRequest, TaskItem, UnitUser, User } from '../../types';
import { SupervisorFiltersBar } from '../supervisor/components/molecules/SupervisorFiltersBar';
import { SupervisorDashboardHomePage } from '../supervisor/pages/SupervisorDashboardHomePage';
import { SupervisorTemporalPage } from '../supervisor/pages/SupervisorTemporalPage';
import type { TaskSortBy } from '../supervisor/types';

const mockUnitUsers: UnitUser[] = [
  { id: 1, name: 'Mario San', email: 'mario@co2.com', role: 'STANDARD' },
  { id: 2, name: 'Darlene Fox', email: 'darlene@co2.com', role: 'STANDARD' },
  { id: 3, name: 'Ralph Edwards', email: 'ralph@co2.com', role: 'STANDARD' },
  { id: 4, name: 'Courtney Henry', email: 'courtney@co2.com', role: 'STANDARD' },
];

const mockTasks: TaskItem[] = [
  {
    id: 101,
    title: 'Auditoría de inventario CO2',
    description: 'Validar equipos registrados en almacén central y actualizar observaciones pendientes.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    dueDate: '2026-02-18T11:30:00.000Z',
    completedAt: null,
    createdAt: '2026-02-14T09:00:00.000Z',
    organizationalUnitCode: 'RRHH',
    organizationalUnitName: 'Recursos Humanos (RRHH)',
    createdBy: 'Marcos Supervisor',
    approvedBy: null,
    assignedToUserId: 1,
    assignedTo: 'Mario San',
  },
  {
    id: 102,
    title: 'Revisión de tickets críticos',
    description: 'Revisar solicitudes de prioridad alta y dejar decisión de aprobación para cierre del día.',
    status: 'PENDING',
    priority: 'MEDIUM',
    dueDate: '2026-02-19T16:00:00.000Z',
    completedAt: null,
    createdAt: '2026-02-13T15:30:00.000Z',
    organizationalUnitCode: 'RRHH',
    organizationalUnitName: 'Recursos Humanos (RRHH)',
    createdBy: 'Marcos Supervisor',
    approvedBy: null,
    assignedToUserId: 2,
    assignedTo: 'Darlene Fox',
  },
  {
    id: 103,
    title: 'Actualización de reporte mensual',
    description: 'Consolidar métricas de tareas aprobadas y exportar resumen para la reunión gerencial.',
    status: 'COMPLETED',
    priority: 'LOW',
    dueDate: '2026-02-20T10:00:00.000Z',
    completedAt: '2026-02-12T10:45:00.000Z',
    createdAt: '2026-02-12T08:10:00.000Z',
    organizationalUnitCode: 'RRHH',
    organizationalUnitName: 'Recursos Humanos (RRHH)',
    createdBy: 'Marcos Supervisor',
    approvedBy: 'Laura Jefa',
    assignedToUserId: 3,
    assignedTo: 'Ralph Edwards',
  },
];

const initialMockPendingRequests: PendingTaskChangeRequest[] = [
  {
    id: 201,
    taskId: 101,
    changeType: 'UPDATE',
    status: 'PENDING',
    reason: 'Ajuste de prioridad por cambio de urgencia operacional.',
    payload: { priority: 'HIGH', description: 'Actualizar prioridad y observación.' },
    requestedAt: '2026-02-15T08:40:00.000Z',
    requestedBy: 'Mario San',
    organizationalUnitCode: 'RRHH',
    organizationalUnitName: 'Recursos Humanos (RRHH)',
    currentTaskTitle: 'Auditoría de inventario CO2',
  },
  {
    id: 202,
    taskId: 102,
    changeType: 'COMPLETE',
    status: 'PENDING',
    reason: 'Solicitud de cierre por cumplimiento total del checklist.',
    payload: {},
    requestedAt: '2026-02-15T10:15:00.000Z',
    requestedBy: 'Darlene Fox',
    organizationalUnitCode: 'RRHH',
    organizationalUnitName: 'Recursos Humanos (RRHH)',
    currentTaskTitle: 'Revisión de tickets críticos',
  },
  {
    id: 203,
    taskId: 103,
    changeType: 'DELETE',
    status: 'PENDING',
    reason: 'Registro duplicado detectado por el equipo de control.',
    payload: {},
    requestedAt: '2026-02-15T11:20:00.000Z',
    requestedBy: 'Ralph Edwards',
    organizationalUnitCode: 'RRHH',
    organizationalUnitName: 'Recursos Humanos (RRHH)',
    currentTaskTitle: 'Actualización de reporte mensual',
  },
];

interface StandardDashboardPageProps {
  user: User;
  onLogout: () => void;
}

export const StandardDashboardPage = ({ user, onLogout }: StandardDashboardPageProps) => {
  const [activeBoard, setActiveBoard] = useState<'general' | 'temporal'>('general');
  const [searchText, setSearchText] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<TaskItem['priority'] | null>(null);
  const [sortBy, setSortBy] = useState<TaskSortBy>('new');
  const [selectedAssignees, setSelectedAssignees] = useState<Record<number, string>>({});
  const [pendingRequests, setPendingRequests] = useState<PendingTaskChangeRequest[]>(initialMockPendingRequests);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handlePriorityFilter = (priority: TaskItem['priority']) => {
    setPriorityFilter((current) => (current === priority ? null : priority));
  };

  const filteredTasks = useMemo(() => {
    const normalized = searchText.trim().toLowerCase();

    const base = mockTasks.filter((task) => {
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
  }, [searchText, priorityFilter, sortBy]);

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

  return (
    <main className="flex min-h-screen flex-col bg-[var(--fondo)] text-[var(--blanco)]">
      <section className="px-2 pt-0 sm:px-5">
        <header className="relative -mx-2 mb-0 overflow-hidden px-2 py-2 sm:-mx-5 sm:px-5 sm:py-3">
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
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--blanco)]/90 hover:text-[var(--blanco)]"
                aria-label="Notificaciones"
                title="Notificaciones"
              >
                <FaBell />
              </button>

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

          {feedback && (
            <div className="mb-3 rounded-md border border-[var(--dorado)]/40 bg-[var(--dorado)]/10 px-3 py-2 text-sm text-[var(--blanco)]">
              {feedback}
            </div>
          )}

          {activeBoard === 'general' && (
            <SupervisorDashboardHomePage
              tasks={filteredTasks}
              selectedAssignees={selectedAssignees}
              unitUsers={mockUnitUsers}
              onAssigneeChange={(taskId, userId) =>
                setSelectedAssignees((state) => ({
                  ...state,
                  [taskId]: userId,
                }))
              }
              onAssignTask={(taskId) => setFeedback(`Solicitud de asignación enviada para tarea #${taskId}.`)}
              onCompleteTask={(taskId) => setFeedback(`Solicitud de completado enviada para tarea #${taskId}.`)}
              onDeleteTask={(taskId) => setFeedback(`Solicitud de eliminación enviada para tarea #${taskId}.`)}
            />
          )}

          {activeBoard === 'temporal' && (
            <SupervisorTemporalPage
              pendingRequests={filteredPendingRequests}
              onDecision={(requestId, decision) => {
                setPendingRequests((state) => state.filter((request) => request.id !== requestId));
                setFeedback(
                  decision === 'APPROVED'
                    ? `Solicitud #${requestId} aprobada correctamente.`
                    : `Solicitud #${requestId} rechazada correctamente.`,
                );
              }}
            />
          )}
        </div>
      </section>
    </main>
  );
};
