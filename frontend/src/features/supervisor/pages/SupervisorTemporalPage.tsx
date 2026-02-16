import { useEffect, useMemo, useState } from 'react';
import type { PendingTaskChangeRequest } from '../../../types';
import { PaginationControls } from '../components/molecules/PaginationControls';
import { changeTypeLabelMap, formatDate } from '../utils';

const ITEMS_PER_PAGE = 8;

interface SupervisorTemporalPageProps {
  pendingRequests: PendingTaskChangeRequest[];
  onDecision: (requestId: number, decision: 'APPROVED' | 'REJECTED') => void;
}

export const SupervisorTemporalPage = ({ pendingRequests, onDecision }: SupervisorTemporalPageProps) => {
  const [selectedRequest, setSelectedRequest] = useState<PendingTaskChangeRequest | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [pendingRequests]);

  const totalPages = Math.max(1, Math.ceil(pendingRequests.length / ITEMS_PER_PAGE));

  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return pendingRequests.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [pendingRequests, currentPage]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {paginatedRequests.map((request) => (
          <article
            key={request.id}
            onClick={() => setSelectedRequest(request)}
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
                <span className="text-sm font-semibold text-[var(--blanco)]/80">Solicitud #{request.id}</span>
                <span className="rounded-full bg-[#2A2418] px-2 py-0.5 text-[10px] font-semibold text-[#F6C66E]">PENDIENTE</span>
              </div>

              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="rounded-full bg-[#1E2431] px-2 py-0.5 text-[10px] font-semibold text-[#8ED0FF]">
                  {changeTypeLabelMap[request.changeType]}
                </span>
                <span className="rounded-full bg-[#251E24] px-2 py-0.5 text-[10px] font-medium text-[#F19FB4]">
                  {new Date(request.requestedAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <h4 className="mb-1 line-clamp-2 text-sm font-semibold text-[var(--blanco)]">
                {request.currentTaskTitle ?? 'Nueva tarea solicitada'}
              </h4>
              <p className="mb-3 min-h-[48px] text-xs leading-relaxed text-[var(--blanco)]/65">
                {request.reason || 'Solicitud enviada para revisión del supervisor.'}
              </p>

              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#B8D9CC] text-[10px] font-bold text-[#2A6B56]">
                  {request.requestedBy
                    .split(' ')
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </span>
                <p className="truncate text-xs font-semibold text-[var(--blanco)]/90">{request.requestedBy}</p>
              </div>
            </div>

            <span className="pointer-events-none absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-[var(--dorado)] to-transparent" />
          </article>
        ))}
      </div>

      <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {pendingRequests.length === 0 && (
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-[var(--blanco)]/75">
          No hay solicitudes temporales pendientes.
        </div>
      )}

      {selectedRequest && (
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
                  <p className="text-xs font-semibold text-[var(--blanco)]/70">Solicitud #{selectedRequest.id}</p>
                  <h3 className="text-lg font-semibold text-[var(--blanco)] sm:text-xl">
                    {selectedRequest.currentTaskTitle ?? 'Nueva tarea solicitada'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-1 text-xl leading-none text-[var(--blanco)]/80 hover:text-[var(--blanco)]"
                  aria-label="Cerrar detalle"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 text-sm text-[var(--blanco)]/85 sm:grid-cols-2">
                <div className="rounded-lg bg-black/20 p-3">
                  <p className="text-[11px] text-[var(--blanco)]/55">Tipo de cambio</p>
                  <p className="font-semibold">{changeTypeLabelMap[selectedRequest.changeType]}</p>
                </div>
                <div className="rounded-lg bg-black/20 p-3">
                  <p className="text-[11px] text-[var(--blanco)]/55">Estado</p>
                  <p className="font-semibold">Pendiente</p>
                </div>
                <div className="rounded-lg bg-black/20 p-3 sm:col-span-2">
                  <p className="text-[11px] text-[var(--blanco)]/55">Motivo</p>
                  <p className="leading-relaxed">
                    {selectedRequest.reason || 'Sin motivo adicional proporcionado por el solicitante.'}
                  </p>
                </div>
                <div className="rounded-lg bg-black/20 p-3">
                  <p className="text-[11px] text-[var(--blanco)]/55">Fecha solicitud</p>
                  <p className="font-semibold">{formatDate(selectedRequest.requestedAt)}</p>
                </div>
                <div className="rounded-lg bg-black/20 p-3">
                  <p className="text-[11px] text-[var(--blanco)]/55">Solicitante</p>
                  <p className="font-semibold">{selectedRequest.requestedBy}</p>
                </div>
                <div className="rounded-lg bg-black/20 p-3 sm:col-span-2">
                  <p className="text-[11px] text-[var(--blanco)]/55">Unidad</p>
                  <p className="font-semibold">
                    {selectedRequest.organizationalUnitName} ({selectedRequest.organizationalUnitCode})
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onDecision(selectedRequest.id, 'REJECTED');
                    setSelectedRequest(null);
                  }}
                  className="rounded-lg border border-red-400/35 px-4 py-2 text-sm font-semibold text-red-300"
                >
                  Rechazar solicitud
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDecision(selectedRequest.id, 'APPROVED');
                    setSelectedRequest(null);
                  }}
                  className="rounded-lg bg-[var(--dorado)] px-4 py-2 text-sm font-semibold text-[var(--blanco)]"
                >
                  Aprobar solicitud
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
