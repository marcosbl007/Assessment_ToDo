import { FaCheckCircle, FaClock, FaTasks } from 'react-icons/fa';

interface ReportData {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  pendingApprovals: number;
}

interface SupervisorReportsPageProps {
  reportData: ReportData;
}

type RingSegment = {
  label: string;
  value: number;
  color: string;
};

type HistoryRow = {
  task: string;
  priority: 'Alta' | 'Media' | 'Baja';
  status: 'Completada' | 'En Progreso' | 'Rechazada';
  endDate: string;
};

const summaryCards = [
  { label: 'Total Tareas', value: 7, sub: 'Total Tareas', tone: 'text-[#F4CE74]', icon: FaTasks },
  { label: 'Completadas', value: 3, sub: 'Completadas', tone: 'text-[#95E28F]', icon: FaCheckCircle },
  { label: 'En Progreso', value: 2, sub: 'En Progreso', tone: 'text-[#8ED0FF]', icon: FaClock },
];

const currentStatusSegments: RingSegment[] = [
  { label: 'Completadas', value: 3, color: '#56D3FF' },
  { label: 'En progreso', value: 2, color: '#F3C75F' },
  { label: 'Pendientes', value: 1, color: '#95E28F' },
  { label: 'Rechazadas', value: 1, color: '#E77F72' },
];

const resolvedPrioritySegments: RingSegment[] = [
  { label: 'Prioridad Alta', value: 2, color: '#E77F72' },
  { label: 'Prioridad Media', value: 1, color: '#F3C75F' },
  { label: 'Prioridad Baja', value: 0, color: '#95E28F' },
  { label: 'Roja', value: 0, color: '#4D617A' },
];

const historyRows: HistoryRow[] = [
  { task: 'Revisión de CVs', priority: 'Alta', status: 'Completada', endDate: '24 Abr 2024' },
  { task: 'Contratar nuevo Analista', priority: 'Alta', status: 'En Progreso', endDate: '30 Abr 2024' },
  { task: 'Actualizar Manual del Em', priority: 'Media', status: 'Completada', endDate: '15 Abr 2024' },
  { task: 'Auditoría de Cumplimiento', priority: 'Media', status: 'En Progreso', endDate: '30 Abr 2024' },
  { task: 'Actualizar Políticas de RR', priority: 'Baja', status: 'Completada', endDate: '24 Abr 2024' },
  { task: 'Revisión Evaluaciones de D', priority: 'Baja', status: 'Rechazada', endDate: '24 Abr 2024' },
];

const priorityBadgeClass: Record<HistoryRow['priority'], string> = {
  Alta: 'bg-[#2A2418] text-[#F3C75F]',
  Media: 'bg-[#2A2418] text-[#D6B567]',
  Baja: 'bg-[#1F2A1C] text-[#95E28F]',
};

const statusBadgeClass: Record<HistoryRow['status'], string> = {
  Completada: 'bg-[#1B2E2A] text-[#9BE2B3]',
  'En Progreso': 'bg-[#1B2833] text-[#8ED0FF]',
  Rechazada: 'bg-[#2D1D1D] text-[#E99595]',
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

export const SupervisorReportsPage = ({ reportData: _reportData }: SupervisorReportsPageProps) => {
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

        <div className="relative flex min-h-[430px] flex-col overflow-hidden rounded-lg bg-[#15161B] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
          <div
            className="pointer-events-none absolute top-0 left-0 h-20 w-full"
            style={{
              background:
                'linear-gradient(to bottom, rgba(222, 222, 224, 0.02) 0%, rgba(222, 222, 224, 0.04) 18%, rgba(222, 222, 224, 0.02) 42%, transparent 100%)',
            }}
          />

          <div className="relative z-10">
            <h3 className="mb-3 text-sm font-semibold text-[var(--blanco)]">Historial de Tareas</h3>

            <div className="flex-1 overflow-x-auto">
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
                  {historyRows.map((row) => (
                    <tr key={`${row.task}-${row.endDate}`} className="border-b border-white/5 text-[var(--blanco)]/85">
                      <td className="py-2.5 pr-2">{row.task}</td>
                      <td className="py-2.5">
                        <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${priorityBadgeClass[row.priority]}`}>
                          {row.priority}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${statusBadgeClass[row.status]}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-[var(--blanco)]/75">{row.endDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-6 text-xs text-[var(--blanco)]/75">
              {resolvedPrioritySegments.slice(0, 3).map((segment) => (
                <div key={segment.label} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
                  <span>{segment.label}</span>
                </div>
              ))}
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
