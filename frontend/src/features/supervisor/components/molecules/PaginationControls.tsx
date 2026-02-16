import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const PaginationControls = ({ currentPage, totalPages, onPageChange }: PaginationControlsProps) => {
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div className="fixed bottom-3 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center justify-center gap-1.5">
      <div className="flex items-center gap-2 px-2 py-1.5">
        <button
          type="button"
          onClick={() => canGoPrev && onPageChange(currentPage - 1)}
          disabled={!canGoPrev}
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
          {currentPage}
          <span className="pointer-events-none absolute -bottom-[2px] left-0 right-0 h-[2px] bg-[var(--dorado)]" />
        </button>

        <button
          type="button"
          onClick={() => canGoNext && onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          className="flex h-7 w-7 items-center justify-center rounded text-[var(--blanco)]/70 disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Página siguiente"
        >
          <FaChevronRight size={10} />
        </button>
      </div>

      <p className="text-xs text-[var(--blanco)]/70">
        Página {currentPage} de {totalPages}
      </p>
    </div>
  );
};
