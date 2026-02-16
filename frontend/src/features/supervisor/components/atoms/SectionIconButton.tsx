import type { ReactNode } from 'react';

interface SectionIconButtonProps {
  active: boolean;
  compact?: boolean;
  title: string;
  icon: ReactNode;
  onClick: () => void;
  badgeCount?: number;
}

export const SectionIconButton = ({ active, compact = false, title, icon, onClick, badgeCount }: SectionIconButtonProps) => {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`relative flex w-full items-center justify-center overflow-hidden rounded-none text-base transition ${
        compact ? 'h-10 text-sm' : 'h-12 sm:h-14 sm:text-lg'
      } ${
        active
          ? 'bg-[#1E212A] text-[var(--dorado)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_20px_rgba(0,0,0,0.35)]'
          : 'text-[var(--blanco)]/55 hover:bg-white/10 hover:text-[var(--blanco)]'
      }`}
    >
      {active && (
        <>
          <span className="pointer-events-none absolute right-0 top-1/2 h-9 w-[2px] -translate-y-1/2 rounded-l bg-[var(--dorado)] sm:h-10" />
          <span
            className="pointer-events-none absolute right-0 top-1/2 h-10 w-4 -translate-y-1/2 sm:h-12"
            style={{
              background:
                'radial-gradient(circle at right center, rgba(157,131,62,0.45) 0%, rgba(157,131,62,0.2) 35%, transparent 75%)',
            }}
          />
        </>
      )}

      <span className="relative z-10">{icon}</span>

      {badgeCount && badgeCount > 0 ? (
        <span className="absolute right-0 top-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {badgeCount}
        </span>
      ) : null}
    </button>
  );
};
