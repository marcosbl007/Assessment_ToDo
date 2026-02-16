import { FaSearch } from 'react-icons/fa';
import type { TaskItem } from '../../../../types';
import type { TaskSortBy } from '../../types';

interface SupervisorFiltersBarProps {
  searchText: string;
  onSearchTextChange: (value: string) => void;
  priorityFilter: TaskItem['priority'] | null;
  onPriorityFilterChange: (priority: TaskItem['priority']) => void;
  sortBy: TaskSortBy;
  onSortByChange: (value: TaskSortBy) => void;
}

const filterButtonClass = (isActive: boolean) =>
  `relative overflow-hidden rounded-full border px-3 py-2 text-xs shadow-[0_8px_24px_rgba(0,0,0,0.25)] sm:px-4 sm:text-sm ${
    isActive
      ? 'border-[var(--dorado)] bg-[#15161B] text-[var(--blanco)]'
      : 'border-white/15 bg-[#15161B] text-[var(--blanco)]/85'
  }`;

export const SupervisorFiltersBar = ({
  searchText,
  onSearchTextChange,
  priorityFilter,
  onPriorityFilterChange,
  sortBy,
  onSortByChange,
}: SupervisorFiltersBarProps) => {
  return (
    <div className="mb-4 flex w-full flex-wrap items-center gap-2">
      <div className="order-1 relative flex min-w-0 basis-full items-center gap-2 overflow-hidden rounded-full border border-white/15 bg-[#15161B] px-3 py-2 text-xs text-[var(--blanco)]/65 shadow-[0_8px_24px_rgba(0,0,0,0.25)] md:basis-auto md:flex-1 md:px-4 md:text-sm">
        <FaSearch className="text-[var(--blanco)]/45" />
        <input
          type="text"
          value={searchText}
          onChange={(event) => onSearchTextChange(event.target.value)}
          placeholder="Search order, product, customer"
          className="w-full bg-transparent text-xs text-[var(--blanco)] outline-none sm:text-sm"
        />
        <span className="pointer-events-none absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[var(--dorado)] to-transparent" />
      </div>

      <button
        type="button"
        onClick={() => onPriorityFilterChange('HIGH')}
        className={`order-2 ${filterButtonClass(priorityFilter === 'HIGH')}`}
      >
        Prioridad alta
        <span className="pointer-events-none absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[var(--dorado)] to-transparent" />
      </button>

      <button
        type="button"
        onClick={() => onPriorityFilterChange('LOW')}
        className={`order-2 ${filterButtonClass(priorityFilter === 'LOW')}`}
      >
        Prioridad baja
        <span className="pointer-events-none absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[var(--dorado)] to-transparent" />
      </button>

      <button
        type="button"
        onClick={() => onPriorityFilterChange('MEDIUM')}
        className={`order-2 ${filterButtonClass(priorityFilter === 'MEDIUM')}`}
      >
        Prioridad media
        <span className="pointer-events-none absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[var(--dorado)] to-transparent" />
      </button>

      <div className="order-3 relative basis-full overflow-hidden rounded-full border border-white/15 bg-[#15161B] px-3 py-2 text-xs text-[var(--blanco)]/85 shadow-[0_8px_24px_rgba(0,0,0,0.25)] sm:px-4 sm:text-sm md:ml-auto md:basis-auto">
        <label className="mr-2 text-[var(--blanco)]/70">Sort by:</label>
        <select
          value={sortBy}
          onChange={(event) => onSortByChange(event.target.value as TaskSortBy)}
          className="max-w-full bg-transparent text-xs text-[var(--blanco)] outline-none sm:text-sm"
        >
          <option value="new" className="bg-[#15161B]">
            Nuevo
          </option>
          <option value="old" className="bg-[#15161B]">
            Viejo
          </option>
          <option value="alphabetical" className="bg-[#15161B]">
            Alfabético
          </option>
          <option value="id-asc" className="bg-[#15161B]">
            Ascendente por ID
          </option>
        </select>
        <span className="pointer-events-none absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[var(--dorado)] to-transparent" />
      </div>
    </div>
  );
};
