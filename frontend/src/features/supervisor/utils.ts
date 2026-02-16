/**
 * - Utilidades de presentación para vistas de supervisor.
 * - Mapea etiquetas de secciones, tipos de cambio y formatos visuales.
 */
import type { PendingTaskChangeRequest, TaskItem } from '../../types';
import type { SupervisorSection } from './types';

/** Etiqueta visible por sección para encabezados y navegación. */
export const sectionTitleMap: Record<SupervisorSection, string> = {
  dashboard: 'Dashboard',
  temporal: 'Dashboard Temporal',
  reportes: 'Reportes',
  notificaciones: 'Notificaciones',
  configuracion: 'Configuración',
};

/** Etiqueta amigable para cada tipo de solicitud de cambio. */
export const changeTypeLabelMap: Record<PendingTaskChangeRequest['changeType'], string> = {
  CREATE: 'Creación',
  UPDATE: 'Actualización',
  COMPLETE: 'Completado',
  DELETE: 'Eliminación',
};

/** Formatea fecha a locale ES o devuelve fallback legible. */
export function formatDate(value: string | null): string {
  if (!value) {
    return 'Sin fecha';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Sin fecha' : date.toLocaleString('es-ES');
}

/** Traduce prioridad de dominio a etiqueta corta en español. */
export function getPriorityLabel(priority: TaskItem['priority']): string {
  if (priority === 'HIGH') return 'Alta';
  if (priority === 'LOW') return 'Baja';
  return 'Media';
}
