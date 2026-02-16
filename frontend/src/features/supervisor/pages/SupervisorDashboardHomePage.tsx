/**
 * - Vista de tarjetas del dashboard general de tareas.
 * - Incluye modal de detalle con acciones y edición contextual.
 */
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { TaskItem, UnitUser } from '../../../types';
import { PaginationControls } from '../components/molecules/PaginationControls';
import { formatDate } from '../utils';

const ITEMS_PER_PAGE = 6;

interface SupervisorDashboardHomePageProps {
  tasks: TaskItem[];
  selectedAssignees: Record<number, string>;
  selectedDueDates: Record<number, string>;
  unitUsers: UnitUser[];
  isRequestMode?: boolean;
  onAssigneeChange: (taskId: number, userId: string) => void;
  onDueDateChange: (taskId: number, dueDate: string) => void;
  onAssignTask: (taskId: number) => void;
  onCompleteTask: (taskId: number) => void;
  onDeleteTask: (taskId: number) => void;
}

export const SupervisorDashboardHomePage = ({
  tasks,
  selectedAssignees,
  selectedDueDates,
  unitUsers,
  isRequestMode = false,
  onAssigneeChange,
  onDueDateChange,
  onAssignTask,
  onCompleteTask,
  onDeleteTask,
}: SupervisorDashboardHomePageProps) => {
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [tasks]);

  const totalPages = Math.max(1, Math.ceil(tasks.length / ITEMS_PER_PAGE));

  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return tasks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [tasks, currentPage]);

  const statusLabelMap: Record<TaskItem['status'], string> = {
    PENDING: 'Pendiente',
    IN_PROGRESS: 'Activa',
    COMPLETED: 'Completada',
  };

  const statusClassMap: Record<TaskItem['status'], string> = {
    PENDING: 'text-[#F6C66E]',
    IN_PROGRESS: 'text-[#56D3FF]',
    COMPLETED: 'text-[#95E28F]',
  };

  const priorityLabelMap: Record<TaskItem['priority'], string> = {
    HIGH: 'Alta',
    MEDIUM: 'Media',
    LOW: 'Baja',
  };

  const priorityClassMap: Record<TaskItem['priority'], string> = {
    HIGH: 'text-[#FF7D9B] bg-[#2A1920]',
    MEDIUM: 'text-[#F6C66E] bg-[#2A2418]',
    LOW: 'text-[#95E28F] bg-[#18261B]',
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();

  const datePill = (value: string | null) => {
    if (!value) {
      return 'Sin fecha';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return 'Sin fecha';
    }

    return parsed.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="flex min-h-[calc(100dvh-280px)] flex-col gap-4 pb-6 lg:pb-24">
      {tasks.length === 0 && (
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-[var(--blanco)]/75">
          No hay tareas aprobadas en este momento.
        </div>
      )}

      <div className="grid auto-rows-fr grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        {paginatedTasks.map((task) => (
          <article
            key={task.id}
            onClick={() => setSelectedTask(task)}
            className="relative h-full min-h-[250px] cursor-pointer overflow-hidden rounded-lg bg-[#15161B] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
          >
            <div
              className="pointer-events-none absolute top-0 left-0 h-20 w-full"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(222, 222, 224, 0.02) 0%, rgba(222, 222, 224, 0.04) 18%, rgba(222, 222, 224, 0.02) 42%, transparent 100%)',
              }}
            />

            <div className="relative z-10 flex h-full flex-col pt-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <span className="text-sm font-semibold text-[var(--blanco)]/80">#{task.id}</span>
                <span className={`text-xs font-semibold uppercase tracking-[0.06em] ${statusClassMap[task.status]}`}>
                  {statusLabelMap[task.status]}
                </span>
              </div>

              <div className="mt-4 mb-3 flex items-center justify-between gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityClassMap[task.priority]}`}>
                  Prioridad {priorityLabelMap[task.priority]}
                </span>
                <span className="rounded-full bg-[#251E24] px-2 py-0.5 text-[10px] font-medium text-[#F19FB4]">
                  {datePill(task.dueDate)}
                </span>
              </div>

              <h4 className="mb-2 line-clamp-2 text-sm font-semibold text-[var(--blanco)]">{task.title}</h4>
              <p className="mb-4 line-clamp-3 text-xs leading-relaxed text-[var(--blanco)]/65">{task.description}</p>

              <div className="mt-auto flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#B8D9CC] text-[10px] font-bold text-[#2A6B56]">
                  {getInitials(task.assignedTo ?? task.createdBy)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-[var(--blanco)]/90">
                    {task.assignedTo ?? 'Sin asignar'}
                  </p>
                </div>
              </div>
            </div>

            <span className="pointer-events-none absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-[var(--dorado)] to-transparent" />
          </article>
        ))}
      </div>

      <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {selectedTask &&
        createPortal(
          <div className="fixed inset-0 z-[220] overflow-y-auto bg-black/50 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6">
            <div className="flex min-h-full items-start justify-center sm:items-center">
              <div className="relative mt-12 w-full max-w-2xl overflow-hidden rounded-lg bg-[#15161B] p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] sm:mt-0 md:p-6">
            <div
              className="pointer-events-none absolute top-0 left-0 h-32 w-full"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(222, 222, 224, 0.02) 0%, rgba(222, 222, 224, 0.04) 18%, rgba(222, 222, 224, 0.02) 42%, transparent 100%)',
              }}
            />
            <div
              className="pointer-events-none absolute top-1/2 right-0 h-[90%] w-[1px] -translate-y-1/2"
              style={{
                background:
                  'linear-gradient(to bottom, transparent 0%, rgba(157, 131, 62, 0.7) 15%, rgba(157, 131, 62, 0.7) 85%, transparent 100%)',
              }}
            />

                <div className="relative z-10">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-[var(--blanco)]/70">Tarea #{selectedTask.id}</p>
                  <h3 className="text-lg font-semibold text-[var(--blanco)] sm:text-xl">{selectedTask.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-1 text-xl leading-none text-[var(--blanco)]/80 hover:text-[var(--blanco)]"
                  aria-label="Cerrar detalle"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 text-sm text-[var(--blanco)]/85 sm:grid-cols-2">
                <div className="rounded-lg bg-black/20 p-3">
                  <p className="text-[11px] text-[var(--blanco)]/55">Estado</p>
                  <p className="font-semibold">{statusLabelMap[selectedTask.status]}</p>
                </div>
                <div className="rounded-lg bg-black/20 p-3">
                  <p className="text-[11px] text-[var(--blanco)]/55">Prioridad</p>
                  <p className="font-semibold">{priorityLabelMap[selectedTask.priority]}</p>
                </div>
                <div className="rounded-lg bg-black/20 p-3 sm:col-span-2">
                  <p className="text-[11px] text-[var(--blanco)]/55">Descripción</p>
                  <p className="leading-relaxed">{selectedTask.description}</p>
                </div>
                <div className="rounded-lg bg-black/20 p-3">
                  <p className="text-[11px] text-[var(--blanco)]/55">Fecha creación</p>
                  <p className="font-semibold">{formatDate(selectedTask.createdAt)}</p>
                </div>
                <div className="rounded-lg bg-black/20 p-3">
                  <p className="text-[11px] text-[var(--blanco)]/55">Fecha objetivo</p>
                  <p className="font-semibold">{selectedTask.dueDate ? formatDate(selectedTask.dueDate) : 'Sin fecha'}</p>
                </div>
                <div className="rounded-lg bg-black/20 p-3">
                  <p className="text-[11px] text-[var(--blanco)]/55">Asignó tarea</p>
                  <p className="font-semibold">{selectedTask.createdBy}</p>
                </div>
                <div className="rounded-lg bg-black/20 p-3">
                  <p className="text-[11px] text-[var(--blanco)]/55">Asignada a</p>
                  <p className="font-semibold">{selectedTask.assignedTo ?? 'Sin asignar'}</p>
                </div>
                <div className="rounded-lg bg-black/20 p-3 sm:col-span-2">
                  <p className="text-[11px] text-[var(--blanco)]/55">Unidad</p>
                  <p className="font-semibold">
                    {selectedTask.organizationalUnitName} ({selectedTask.organizationalUnitCode})
                  </p>
                </div>
                <div className="rounded-lg bg-black/20 p-3 sm:col-span-2">
                  <p className="mb-2 text-[11px] text-[var(--blanco)]/55">
                    {isRequestMode ? 'Solicitar reasignación' : 'Reasignar tarea'}
                  </p>
                  <select
                    value={selectedAssignees[selectedTask.id] ?? String(selectedTask.assignedToUserId ?? '')}
                    onChange={(event) => onAssigneeChange(selectedTask.id, event.target.value)}
                    className="w-full rounded-md border border-white/15 bg-transparent px-3 py-2 text-xs text-[var(--blanco)] outline-none focus:border-[var(--dorado)]/45"
                  >
                    <option value="">Seleccionar usuario...</option>
                    {unitUsers.map((unitUser) => (
                      <option key={unitUser.id} value={unitUser.id}>
                        {unitUser.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="rounded-lg bg-black/20 p-3 sm:col-span-2">
                  <p className="mb-2 text-[11px] text-[var(--blanco)]/55">
                    {isRequestMode ? 'Solicitar actualización de fecha' : 'Editar fecha objetivo'}
                  </p>
                  <input
                    type="date"
                    value={selectedDueDates[selectedTask.id] ?? (selectedTask.dueDate ? selectedTask.dueDate.slice(0, 10) : '')}
                    onChange={(event) => onDueDateChange(selectedTask.id, event.target.value)}
                    className="w-full rounded-md border border-white/15 bg-transparent px-3 py-2 text-xs text-[var(--blanco)] outline-none focus:border-[var(--dorado)]/45"
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onDeleteTask(selectedTask.id);
                    setSelectedTask(null);
                  }}
                  className="rounded-lg border border-red-400/35 px-4 py-2 text-sm font-semibold text-red-300"
                >
                  {isRequestMode ? 'Solicitar eliminación' : 'Eliminar tarea'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onCompleteTask(selectedTask.id);
                    setSelectedTask(null);
                  }}
                  disabled={selectedTask.status === 'COMPLETED'}
                  className="rounded-lg border border-[#9BE2B3]/35 px-4 py-2 text-sm font-semibold text-[#9BE2B3] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {isRequestMode ? 'Solicitar aprobación' : 'Completar tarea'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onAssignTask(selectedTask.id);
                    setSelectedTask(null);
                  }}
                  className="rounded-lg bg-[var(--dorado)] px-4 py-2 text-sm font-semibold text-[var(--blanco)]"
                >
                  {isRequestMode ? 'Solicitar actualización' : 'Actualizar tarea'}
                </button>
              </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
