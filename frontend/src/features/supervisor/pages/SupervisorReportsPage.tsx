/**
 * - Página de reportes del supervisor.
 * - Muestra KPIs, distribución y historial paginado de tareas.
 */
import { useEffect, useMemo, useState } from 'react';
import { FaCheckCircle, FaChevronLeft, FaChevronRight, FaClock, FaTasks } from 'react-icons/fa';
import type { SupervisorReportSnapshot } from '../../../types';

interface SupervisorReportsPageProps {
  reportData: SupervisorReportSnapshot;
}

const HISTORY_ITEMS_PER_PAGE = 5;

type RingSegment = {
  label: string;
  value: number;
  color: string;
};

const priorityBadgeClass: Record<'HIGH' | 'MEDIUM' | 'LOW', string> = {
  HIGH: 'bg-[#2D1D1D] text-[#E99595]',
  MEDIUM: 'bg-[#2A2418] text-[#D6B567]',
  LOW: 'bg-[#1F2A1C] text-[#95E28F]',
};

const statusBadgeClass: Record<'PENDING' | 'COMPLETED' | 'REJECTED', string> = {
  PENDING: 'bg-[#2A2418] text-[#D6B567]',
  COMPLETED: 'bg-[#1B2E2A] text-[#9BE2B3]',
  REJECTED: 'bg-[#2D1D1D] text-[#E99595]',
};

const priorityLabelMap: Record<'HIGH' | 'MEDIUM' | 'LOW', string> = {
  HIGH: 'Alta',
  MEDIUM: 'Media',
  LOW: 'Baja',
};

const statusLabelMap: Record<'PENDING' | 'COMPLETED' | 'REJECTED', string> = {
  PENDING: 'Pendiente',
  COMPLETED: 'Completada',
  REJECTED: 'Rechazada',
};

const buildRingGradient = (segments: RingSegment[]): string => {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  if (total === 0) {
    return 'conic-gradient(#2b2f39 0deg 360deg)';
  }

  let current = 0;
  const stops = segments
    .map((segment) => {
      const start = current;
      const sweep = (segment.value / total) * 360;
      current += sweep;
      return `${segment.color} ${start}deg ${current}deg`;
    })
    .join(', ');

  return `conic-gradient(${stops})`;
};

const toPercent = (value: number, total: number) => {
  if (total === 0) return '0,0%';
  return `${((value / total) * 100).toFixed(1).replace('.', ',')}%`;
};

const RingChart = ({ title, segments }: { title: string; segments: RingSegment[] }) => {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <div className="relative overflow-hidden rounded-lg bg-[#15161B] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
      <h3 className="mb-3 text-sm font-semibold text-[var(--blanco)]">{title}</h3>

      <div className="mb-4 flex items-center justify-center">
        <div className="relative h-36 w-36 rounded-full" style={{ background: buildRingGradient(segments) }}>
          <div className="absolute inset-[24%] rounded-full bg-[#15161B]" />
        </div>
      </div>

      <div className="space-y-2 text-xs">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center justify-between text-[var(--blanco)]/75">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
              <span>{segment.label}</span>
            </div>
            <span>
              {segment.value} ({toPercent(segment.value, total)})
            </span>
          </div>
        ))}
      </div>

      <span className="pointer-events-none absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-[var(--dorado)] to-transparent" />
    </div>
  );
};

export const SupervisorReportsPage = ({ reportData }: SupervisorReportsPageProps) => {
  const [historyPage, setHistoryPage] = useState(1);

  const totalHistoryPages = Math.max(1, Math.ceil(reportData.history.length / HISTORY_ITEMS_PER_PAGE));

  const paginatedHistory = useMemo(() => {
    const start = (historyPage - 1) * HISTORY_ITEMS_PER_PAGE;
    return reportData.history.slice(start, start + HISTORY_ITEMS_PER_PAGE);
  }, [reportData.history, historyPage]);

  useEffect(() => {
    setHistoryPage(1);
  }, [reportData.history]);

  useEffect(() => {
    if (historyPage > totalHistoryPages) {
      setHistoryPage(totalHistoryPages);
    }
  }, [historyPage, totalHistoryPages]);

  const summaryCards = [
    { label: 'Total Tareas', value: reportData.total, sub: 'Total Tareas', tone: 'text-[#F4CE74]', icon: FaTasks },
    {
      label: 'Completadas',
      value: reportData.completed,
      sub: 'Completadas',
      tone: 'text-[#95E28F]',
      icon: FaCheckCircle,
    },
    {
      label: 'Pendientes',
      value: reportData.pending,
      sub: 'Pendientes',
      tone: 'text-[#F6C66E]',
      icon: FaClock,
    },
  ];

  const currentStatusSegments: RingSegment[] = [
    { label: 'Completadas', value: reportData.statusDistribution.completed, color: '#56D3FF' },
    { label: 'Pendientes', value: reportData.statusDistribution.pending, color: '#95E28F' },
    { label: 'Rechazadas', value: reportData.statusDistribution.rejected, color: '#E77F72' },
  ];

  const resolvedPrioritySegments: RingSegment[] = [
    { label: 'Prioridad Alta', value: reportData.priorityDistribution.high, color: '#E77F72' },
    { label: 'Prioridad Media', value: reportData.priorityDistribution.medium, color: '#F3C75F' },
    { label: 'Prioridad Baja', value: reportData.priorityDistribution.low, color: '#95E28F' },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-4 xl:items-start">
      <div className="space-y-3 xl:col-span-3">
        <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {summaryCards.map((card) => (
            <div key={card.label} className="relative overflow-hidden rounded-lg bg-[#15161B] p-3 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
              <div
                className="pointer-events-none absolute top-0 left-0 h-14 w-full"
                style={{
                  background:
                    'linear-gradient(to bottom, rgba(222, 222, 224, 0.02) 0%, rgba(222, 222, 224, 0.04) 18%, rgba(222, 222, 224, 0.02) 42%, transparent 100%)',
                }}
              />
              <div className="relative z-10">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-xs text-[var(--blanco)]/80">
                    <card.icon className="text-[var(--dorado)]/90" />
                    {card.label}
                  </p>
                  <span className="h-6 w-6 rounded-md border border-white/10 bg-white/5" />
                </div>

                <span className="mb-2 block h-px w-full bg-gradient-to-r from-transparent via-[var(--dorado)] to-transparent" />

                <p className={`text-4xl font-bold leading-none ${card.tone}`}>{card.value}</p>
                <p className="mt-2 text-xs text-[var(--blanco)]/65">{card.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="relative flex h-[470px] flex-col overflow-hidden rounded-lg bg-[#15161B] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
          <div
            className="pointer-events-none absolute top-0 left-0 h-20 w-full"
            style={{
              background:
                'linear-gradient(to bottom, rgba(222, 222, 224, 0.02) 0%, rgba(222, 222, 224, 0.04) 18%, rgba(222, 222, 224, 0.02) 42%, transparent 100%)',
            }}
          />

          <div className="relative z-10 flex h-full flex-col">
            <h3 className="mb-3 text-sm font-semibold text-[var(--blanco)]">Historial de Tareas</h3>

            <div className="flex-1 overflow-x-auto overflow-y-auto">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-[var(--blanco)]/65">
                    <th className="pb-2 font-medium">Tarea</th>
                    <th className="pb-2 font-medium">Prioridad</th>
                    <th className="pb-2 font-medium">Estado</th>
                    <th className="pb-2 text-right font-medium">Fecha Final</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedHistory.map((row) => (
                    <tr key={`${row.id}-${row.endDate}`} className="border-b border-white/5 text-[var(--blanco)]/85">
                      <td className="py-2.5 pr-2">{row.taskTitle}</td>
                      <td className="py-2.5">
                        <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${priorityBadgeClass[row.priority]}`}>
                          {priorityLabelMap[row.priority]}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${statusBadgeClass[row.status]}`}>
                          {statusLabelMap[row.status]}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-[var(--blanco)]/75">
                        {new Date(row.endDate).toLocaleDateString('es-ES')}
                      </td>
                    </tr>
                  ))}
                  {reportData.history.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-3 text-center text-[var(--blanco)]/60">
                        Sin historial de logs registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-auto pt-3">
              {reportData.history.length > 0 && (
                <div className="mb-2 flex items-center justify-center gap-2 px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => setHistoryPage((prev) => Math.max(1, prev - 1))}
                    disabled={historyPage === 1}
                    className="flex h-7 w-7 items-center justify-center rounded text-[var(--blanco)]/70 disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label="Página anterior"
                  >
                    <FaChevronLeft size={10} />
                  </button>

                  <button
                    type="button"
                    className="relative flex h-7 min-w-7 items-center justify-center px-2 text-xs font-semibold text-[var(--blanco)]"
                    aria-current="page"
                  >
                    {historyPage}
                    <span className="pointer-events-none absolute -bottom-[2px] left-0 right-0 h-[2px] bg-[var(--dorado)]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setHistoryPage((prev) => Math.min(totalHistoryPages, prev + 1))}
                    disabled={historyPage === totalHistoryPages}
                    className="flex h-7 w-7 items-center justify-center rounded text-[var(--blanco)]/70 disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label="Página siguiente"
                  >
                    <FaChevronRight size={10} />
                  </button>
                </div>
              )}

              <p className="mb-2 text-center text-xs text-[var(--blanco)]/70">
                Página {historyPage} de {totalHistoryPages}
              </p>

              <div className="flex flex-wrap items-center gap-6 text-xs text-[var(--blanco)]/75">
                {resolvedPrioritySegments.map((segment) => (
                  <div key={segment.label} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
                    <span>{segment.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <span className="pointer-events-none absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-[var(--dorado)] to-transparent" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative overflow-hidden rounded-lg bg-[#15161B] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
          <h3 className="mb-3 text-sm font-semibold text-[var(--blanco)]">Estado Actual de Tareas</h3>
          <div className="flex items-center justify-center">
            <div className="relative h-28 w-28 rounded-full" style={{ background: buildRingGradient(currentStatusSegments) }}>
              <div className="absolute inset-[24%] rounded-full bg-[#15161B]" />
            </div>
          </div>
          <div className="mt-3 space-y-1.5 text-xs text-[var(--blanco)]/75">
            {currentStatusSegments.map((segment) => (
              <div key={segment.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
                  <span>{segment.label}</span>
                </div>
                <span>{segment.value}</span>
              </div>
            ))}
          </div>

          <span className="pointer-events-none absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-[var(--dorado)] to-transparent" />
        </div>

        <div className="h-full">
          <RingChart title="Top Prioridad Resuelta" segments={resolvedPrioritySegments} />
        </div>
      </div>
    </div>
  );
};
