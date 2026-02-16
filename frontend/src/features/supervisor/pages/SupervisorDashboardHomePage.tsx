import { useState } from 'react';
import type { TaskItem, UnitUser } from '../../../types';
import { formatDate } from '../utils';

interface SupervisorDashboardHomePageProps {
  tasks: TaskItem[];
  selectedAssignees: Record<number, string>;
  unitUsers: UnitUser[];
  onAssigneeChange: (taskId: number, userId: string) => void;
  onAssignTask: (taskId: number) => void;
  onCompleteTask: (taskId: number) => void;
  onDeleteTask: (taskId: number) => void;
}

export const SupervisorDashboardHomePage = ({
  tasks: _tasks,
  selectedAssignees: _selectedAssignees,
  unitUsers: _unitUsers,
  onAssigneeChange: _onAssigneeChange,
  onAssignTask: _onAssignTask,
  onCompleteTask: _onCompleteTask,
  onDeleteTask: _onDeleteTask,
}: SupervisorDashboardHomePageProps) => {
  interface PreviewTask extends TaskItem {
    assignedTo: {
      name: string;
      initials: string;
    };
  }

  const previewTasks: PreviewTask[] = [
    {
      id: 101,
      title: 'Auditoría de inventario CO2',
      description: 'Validar equipos registrados en almacén central y actualizar observaciones pendientes.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: '2026-02-18T11:30:00.000Z',
      completedAt: null,
      createdAt: '2026-02-14T09:00:00.000Z',
      organizationalUnitCode: 'RH',
      organizationalUnitName: 'Recursos Humanos',
      createdBy: 'Marcos Supervisor',
      approvedBy: null,
      assignedTo: { name: 'Mario San', initials: 'MS' },
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
      organizationalUnitCode: 'RH',
      organizationalUnitName: 'Recursos Humanos',
      createdBy: 'Marcos Supervisor',
      approvedBy: null,
      assignedTo: { name: 'Darlene Fox', initials: 'DF' },
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
      organizationalUnitCode: 'RH',
      organizationalUnitName: 'Recursos Humanos',
      createdBy: 'Marcos Supervisor',
      approvedBy: 'Laura Jefa',
      assignedTo: { name: 'Floyd Miles', initials: 'FM' },
    },
    {
      id: 104,
      title: 'Control de mantenimiento preventivo',
      description: 'Confirmar checklist de mantenimiento de estaciones de trabajo del segundo piso.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: '2026-02-21T14:15:00.000Z',
      completedAt: null,
      createdAt: '2026-02-11T11:20:00.000Z',
      organizationalUnitCode: 'RH',
      organizationalUnitName: 'Recursos Humanos',
      createdBy: 'Marcos Supervisor',
      approvedBy: null,
      assignedTo: { name: 'Ralph Edwards', initials: 'RE' },
    },
    {
      id: 105,
      title: 'Carga de evidencias semanales',
      description: 'Subir evidencias fotográficas de cumplimiento y documentación firmada del equipo.',
      status: 'PENDING',
      priority: 'MEDIUM',
      dueDate: '2026-02-22T09:00:00.000Z',
      completedAt: null,
      createdAt: '2026-02-10T16:05:00.000Z',
      organizationalUnitCode: 'RH',
      organizationalUnitName: 'Recursos Humanos',
      createdBy: 'Marcos Supervisor',
      approvedBy: null,
      assignedTo: { name: 'Courtney Henry', initials: 'CH' },
    },
    {
      id: 106,
      title: 'Cierre de incidencias atrasadas',
      description: 'Resolver incidencias con más de 7 días y registrar comentario de cierre validado.',
      status: 'COMPLETED',
      priority: 'LOW',
      dueDate: '2026-02-23T12:45:00.000Z',
      completedAt: '2026-02-09T18:25:00.000Z',
      createdAt: '2026-02-09T09:40:00.000Z',
      organizationalUnitCode: 'RH',
      organizationalUnitName: 'Recursos Humanos',
      createdBy: 'Marcos Supervisor',
      approvedBy: 'Laura Jefa',
      assignedTo: { name: 'Munawir Elrendi', initials: 'ME' },
    },
  ];

  const [selectedTask, setSelectedTask] = useState<PreviewTask | null>(null);

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
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {previewTasks.map((task) => (
          <article
            key={task.id}
            onClick={() => setSelectedTask(task)}
            className="relative cursor-pointer overflow-hidden rounded-lg bg-[#15161B] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
          >
            <div
              className="pointer-events-none absolute top-0 left-0 h-20 w-full"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(222, 222, 224, 0.02) 0%, rgba(222, 222, 224, 0.04) 18%, rgba(222, 222, 224, 0.02) 42%, transparent 100%)',
              }}
            />

            <div className="relative z-10">
              <div className="mb-2 flex items-start justify-between gap-2">
                <span className="text-sm font-semibold text-[var(--blanco)]/80">#{task.id}</span>
                <span className={`text-xs font-semibold uppercase tracking-[0.06em] ${statusClassMap[task.status]}`}>
                  {statusLabelMap[task.status]}
                </span>
              </div>

              <div className="mb-2 flex items-center justify-between gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityClassMap[task.priority]}`}>
                  Prioridad {priorityLabelMap[task.priority]}
                </span>
                <span className="rounded-full bg-[#251E24] px-2 py-0.5 text-[10px] font-medium text-[#F19FB4]">
                  {datePill(task.dueDate)}
                </span>
              </div>

              <h4 className="mb-1 line-clamp-2 text-sm font-semibold text-[var(--blanco)]">{task.title}</h4>
              <p className="mb-3 min-h-[48px] text-xs leading-relaxed text-[var(--blanco)]/65">{task.description}</p>

              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#B8D9CC] text-[10px] font-bold text-[#2A6B56]">
                  {task.assignedTo.initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-[var(--blanco)]/90">{task.assignedTo.name}</p>
                </div>
              </div>
            </div>

            <span className="pointer-events-none absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-[var(--dorado)] to-transparent" />
          </article>
        ))}
      </div>

      {selectedTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-lg bg-[#15161B] p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] md:p-6">
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
                  <p className="font-semibold">{selectedTask.assignedTo.name}</p>
                </div>
                <div className="rounded-lg bg-black/20 p-3 sm:col-span-2">
                  <p className="text-[11px] text-[var(--blanco)]/55">Unidad</p>
                  <p className="font-semibold">
                    {selectedTask.organizationalUnitName} ({selectedTask.organizationalUnitCode})
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  className="rounded-lg border border-red-400/35 px-4 py-2 text-sm font-semibold text-red-300"
                >
                  Eliminar tarea
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-[var(--dorado)] px-4 py-2 text-sm font-semibold text-[var(--blanco)]"
                >
                  Actualizar tarea
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
