interface NotificationItem {
  id: number;
  title: string;
  detail: string;
  date: string;
}

interface SupervisorNotificationsPageProps {
  notifications: NotificationItem[];
}

export const SupervisorNotificationsPage = ({ notifications }: SupervisorNotificationsPageProps) => {
  if (notifications.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[var(--fondo)]/85 backdrop-blur-sm">
        <div className="p-6 text-sm text-[var(--blanco)]/75">
          No hay notificaciones nuevas por ahora.
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[var(--fondo)]/85 backdrop-blur-sm">
      {notifications.map((notification, index) => {
        const meta = getNotificationMeta(notification.title);

        return (
          <article
            key={notification.id}
            className="relative px-4 py-4 sm:px-5"
          >
            {index !== notifications.length - 1 && (
              <div className="pointer-events-none absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[var(--dorado)]/40 to-transparent sm:left-5 sm:right-5" />
            )}

            <div className="flex items-start gap-3">
              <span
                className={`inline-flex shrink-0 items-center rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${meta.tagClass}`}
              >
                {meta.tag}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <h3 className="text-sm font-semibold text-[var(--blanco)]">{notification.title}</h3>
                  <span className="shrink-0 text-xs text-[var(--blanco)]/55">{notification.date}</span>
                </div>

                <p className="mt-1 text-sm text-[var(--blanco)]/75">{notification.detail}</p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};
const getNotificationMeta = (title: string) => {
  if (title.toLowerCase().includes('creación') || title.toLowerCase().includes('creacion')) {
    return { tag: 'Nueva tarea', tagClass: 'bg-[#D9B24C]/15 text-[#F4D88A] border-[#D9B24C]/35' };
  }

  if (title.toLowerCase().includes('actualización') || title.toLowerCase().includes('actualizacion')) {
    return { tag: 'Actualización', tagClass: 'bg-[#7DD3FC]/15 text-[#BAE6FD] border-[#7DD3FC]/35' };
  }

  if (title.toLowerCase().includes('eliminación') || title.toLowerCase().includes('eliminacion')) {
    return { tag: 'Eliminación', tagClass: 'bg-[#FCA5A5]/15 text-[#FECACA] border-[#FCA5A5]/35' };
  }

  return { tag: 'Notificación', tagClass: 'bg-white/10 text-[var(--blanco)]/85 border-white/20' };
};
