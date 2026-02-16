import { FaBell, FaChartBar, FaClipboardList, FaCog, FaHome, FaPowerOff } from 'react-icons/fa';
import type { SupervisorSection } from '../../types';
import co2SmallLogo from '../../../../assets/co2.svg';
import { SectionIconButton } from '../atoms/SectionIconButton';

interface SupervisorSidebarProps {
  activeSection: SupervisorSection;
  pendingCount: number;
  onSectionChange: (section: SupervisorSection) => void;
  onLogout: () => void;
}

export const SupervisorSidebar = ({
  activeSection,
  pendingCount,
  onSectionChange,
  onLogout,
}: SupervisorSidebarProps) => {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex h-screen w-[76px] flex-shrink-0 flex-col justify-between overflow-hidden rounded-none bg-[#15161B] px-0 py-3 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]">
      <div
        className="pointer-events-none absolute top-0 left-0 h-28 w-full"
        style={{
          background:
            'linear-gradient(to bottom, rgba(222, 222, 224, 0.02) 0%, rgba(222, 222, 224, 0.04) 18%, rgba(222, 222, 224, 0.02) 42%, transparent 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute top-1/2 right-0 h-[22rem] w-[22rem] -translate-y-1/2 translate-x-1/2 rounded-full blur-xl"
        style={{
          background:
            'radial-gradient(circle, rgba(157, 131, 62, 0.22) 0%, rgba(157, 131, 62, 0.14) 25%, rgba(157, 131, 62, 0.07) 45%, rgba(157, 131, 62, 0.04) 65%, transparent 85%)',
        }}
      />
      <div
        className="pointer-events-none absolute top-1/2 right-0 h-[92%] w-[1px] -translate-y-1/2"
        style={{
          background:
            'linear-gradient(to bottom, transparent 0%, rgba(157, 131, 62, 0.75) 15%, rgba(157, 131, 62, 0.75) 85%, transparent 100%)',
        }}
      />

      <div className="relative z-10 space-y-2">
        <div className="flex justify-center pb-1">
          <img src={co2SmallLogo} alt="CO2+" className="h-10 w-10 opacity-95" />
        </div>

        <SectionIconButton
          active={activeSection === 'dashboard'}
          title="Dashboard"
          icon={<FaHome />}
          onClick={() => onSectionChange('dashboard')}
        />
        <SectionIconButton
          active={activeSection === 'temporal'}
          title="Dashboard Temporal"
          icon={<FaClipboardList />}
          onClick={() => onSectionChange('temporal')}
        />
        <SectionIconButton
          active={activeSection === 'reportes'}
          title="Reportes"
          icon={<FaChartBar />}
          onClick={() => onSectionChange('reportes')}
        />
      </div>

      <div className="relative z-10 space-y-1">
        <SectionIconButton
          active={activeSection === 'notificaciones'}
          title="Notificaciones"
          icon={<FaBell />}
          badgeCount={pendingCount}
          onClick={() => onSectionChange('notificaciones')}
        />
        <SectionIconButton
          active={activeSection === 'configuracion'}
          title="Configuración"
          icon={<FaCog />}
          onClick={() => onSectionChange('configuracion')}
        />

        <button
          type="button"
          title="Logout"
          onClick={onLogout}
          className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--dorado)] text-[var(--blanco)]"
        >
          <FaPowerOff />
        </button>
      </div>
    </aside>
  );
};
