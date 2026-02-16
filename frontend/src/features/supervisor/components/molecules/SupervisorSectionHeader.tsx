import { FaPlus } from 'react-icons/fa';
import type { SupervisorSection } from '../../types';
import { sectionTitleMap } from '../../utils';

interface SupervisorSectionHeaderProps {
  activeSection: SupervisorSection;
  username: string;
  roleLabel: string;
  unit: string;
  onCreateTask: () => void;
}

export const SupervisorSectionHeader = ({
  activeSection,
  username,
  roleLabel,
  unit,
  onCreateTask,
}: SupervisorSectionHeaderProps) => {
  if (activeSection === 'dashboard') {
    return (
      <div className="relative -mx-2 mb-3 overflow-hidden px-2 py-2 sm:-mx-5 sm:px-5 sm:py-3">
        <div className="relative z-10 flex flex-col items-start justify-between gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <h1 className="min-w-0 max-w-full whitespace-normal break-words text-[10px] font-semibold uppercase leading-tight tracking-[0.06em] text-[var(--blanco)] sm:text-xs md:text-lg lg:text-xl">
            Bienvenido {username} - {roleLabel} {unit}
          </h1>

          <button
            type="button"
            onClick={onCreateTask}
            className="flex items-center gap-2 rounded-lg bg-[var(--dorado)] px-3 py-1.5 text-xs font-semibold text-[var(--blanco)] sm:px-4 sm:py-2 sm:text-sm"
          >
            <FaPlus /> Nueva Tarea
          </button>
        </div>

        <span className="pointer-events-none absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[var(--dorado)] to-transparent sm:left-8 sm:right-8" />
      </div>
    );
  }

  if (
    activeSection === 'temporal' ||
    activeSection === 'reportes' ||
    activeSection === 'notificaciones' ||
    activeSection === 'configuracion'
  ) {
    return (
      <div className="relative -mx-2 mb-3 overflow-hidden px-2 py-2 sm:-mx-5 sm:px-5 sm:py-3">
        <div className="relative z-10 flex flex-col items-start justify-between gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <h1 className="min-w-0 max-w-full whitespace-normal break-words text-[10px] font-semibold uppercase leading-tight tracking-[0.06em] text-[var(--blanco)] sm:text-xs md:text-lg lg:text-xl">
            {sectionTitleMap[activeSection]}
          </h1>
        </div>

        <span className="pointer-events-none absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[var(--dorado)] to-transparent sm:left-8 sm:right-8" />
      </div>
    );
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h1 className="text-2xl font-bold text-[var(--blanco)] sm:text-3xl">{sectionTitleMap[activeSection]}</h1>
    </div>
  );
};
