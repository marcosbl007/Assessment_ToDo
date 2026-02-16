import type { PendingTaskChangeRequest, TaskItem } from '../../types';
import type { SupervisorSection } from './types';

export const sectionTitleMap: Record<SupervisorSection, string> = {
  dashboard: 'Dashboard',
  temporal: 'Dashboard Temporal',
  reportes: 'Reportes',
  notificaciones: 'Notificaciones',
  configuracion: 'Configuración',
};

export const changeTypeLabelMap: Record<PendingTaskChangeRequest['changeType'], string> = {
  CREATE: 'Creación',
  UPDATE: 'Actualización',
  COMPLETE: 'Completado',
  DELETE: 'Eliminación',
};

export function formatDate(value: string | null): string {
  if (!value) {
    return 'Sin fecha';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Sin fecha' : date.toLocaleString('es-ES');
}

export function getPriorityLabel(priority: TaskItem['priority']): string {
  if (priority === 'HIGH') return 'Alta';
  if (priority === 'LOW') return 'Baja';
  return 'Media';
}
