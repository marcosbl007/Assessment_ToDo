import { FaTimes } from 'react-icons/fa';
import type { UnitUser } from '../../../../types';
import type { TaskCreationForm } from '../../types';

interface NewTaskModalProps {
  isOpen: boolean;
  creationForm: TaskCreationForm;
  unitUsers: UnitUser[];
  onClose: () => void;
  onSubmit: () => void;
  onChange: (next: TaskCreationForm) => void;
}

export const NewTaskModal = ({ isOpen, creationForm, unitUsers, onClose, onSubmit, onChange }: NewTaskModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
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
          <div className="relative mb-6 flex items-center justify-center">
            <h3 className="text-center text-2xl font-semibold uppercase tracking-[0.11em] text-[var(--blanco)] sm:text-3xl">
              Nueva solicitud
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="absolute right-0 p-1 text-[var(--blanco)]/80 hover:text-[var(--blanco)]"
              aria-label="Cerrar formulario"
            >
              <FaTimes />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-x-3 gap-y-5 md:grid-cols-2">
            <input
              type="text"
              value={creationForm.title}
              onChange={(event) => onChange({ ...creationForm, title: event.target.value })}
              placeholder="Nombre de la tarea"
              className="w-full rounded-none border-0 border-b-2 border-[var(--dorado)] bg-transparent px-1 py-2 text-sm text-[var(--blanco)] placeholder:text-[var(--blanco)]/50 focus:border-b-[3px] focus:outline-none"
            />
            <input
              type="date"
              value={creationForm.dueDate}
              onChange={(event) => onChange({ ...creationForm, dueDate: event.target.value })}
              className="w-full rounded-none border-0 border-b-2 border-[var(--dorado)] bg-transparent px-1 py-2 text-sm text-[var(--blanco)] focus:border-b-[3px] focus:outline-none"
            />
            <textarea
              value={creationForm.description}
              onChange={(event) => onChange({ ...creationForm, description: event.target.value })}
              placeholder="Descripción"
              className="w-full rounded-none border-0 border-b-2 border-[var(--dorado)] bg-transparent px-1 py-2 text-sm text-[var(--blanco)] placeholder:text-[var(--blanco)]/50 focus:border-b-[3px] focus:outline-none md:col-span-2"
            />
            <select
              value={creationForm.priority}
              onChange={(event) => onChange({ ...creationForm, priority: event.target.value as TaskCreationForm['priority'] })}
              className="w-full rounded-none border-0 border-b-2 border-[var(--dorado)] bg-transparent px-1 py-2 text-sm text-[var(--blanco)] focus:border-b-[3px] focus:outline-none"
            >
              <option value="LOW">Prioridad baja</option>
              <option value="MEDIUM">Prioridad media</option>
              <option value="HIGH">Prioridad alta</option>
            </select>
            <select
              value={creationForm.assignedToUserId}
              onChange={(event) => onChange({ ...creationForm, assignedToUserId: event.target.value })}
              className="w-full rounded-none border-0 border-b-2 border-[var(--dorado)] bg-transparent px-1 py-2 text-sm text-[var(--blanco)] focus:border-b-[3px] focus:outline-none"
            >
              <option value="">Asignar a usuario...</option>
              {unitUsers.map((unitUser) => (
                <option key={unitUser.id} value={unitUser.id}>
                  {unitUser.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--dorado)]/25 px-4 py-2 text-sm text-[var(--blanco)]/85"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="rounded-lg bg-[var(--dorado)] px-4 py-2 text-sm font-semibold text-[var(--blanco)]"
            >
              Enviar solicitud
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
